const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const _ = require('lodash');

const Group = require('../../models/Group');
const User = require('../../models/User');
const Request = require('../../models/Request');

// Bcrypt to encrypt the confirmationCode
const bcrypt = require('bcrypt');
const bcryptSalt = 10;
const salt = bcrypt.genSaltSync(bcryptSalt);

// Email
//const template = require('../../templates/template');
const sendMail = require('../../mail/sendMail');
const fs = require('fs');
const hbs = require('hbs');
const emailTemplate = './views/email/email.hbs';

let newGroup;

// (C)RUD -> Create a NEW Group
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	let owner = req.user;
	let usersSelected = req.body.users;
	let {groupName} = req.body;
	groupName = groupName.toString().toLowerCase();

	// [{"username":"luis", "email":"lugonperez@gmail.com"},{"username":"sara", "email":"sara@gmail.com"}]
	
	const name_limitChar = 50;

	const isOwnerValid = (gOwner) => {
		if (gOwner && Object.prototype.toString.call(gOwner) === '[object Object]') {
			return true;
		} else {
			return false;
		}
	}

	const isGroupNameValid = (gName) => {
		if (gName && gName !== '') {
			gName = gName.trim().replace(/[ ]{2,}/gi,' ');
			if (gName.split('').length <= name_limitChar) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	const areUsersValid = (gUsers) => {
		if (gUsers && gUsers !== '') {
			try {
				JSON.parse(gUsers)
			} catch(err) {
				res.status(403).json({message: 'Group must be an Array of objects'}) 
			}
			return true
		} else {
			console.log('There are not users selected');
			return true;
		}
	} 

	const isEachUserValid = (usersParsed) => {
		if (Object.prototype.toString.call(usersParsed) === '[object Array]') {
			invalidUser = usersParsed.find((gUser) => {
				return Object.prototype.toString.call(gUser) != '[object Object]';
			})
		
			if (invalidUser) {
				
				return false;
			}else {
				return true;
			}
		} else {
			return false;
		}
		
	}

	const isGroupValid = (owner, groupName, usersSelected) => {
		if (isOwnerValid(owner)) {
			if (isGroupNameValid(groupName)) {
				if (areUsersValid(usersSelected)) {
					usersSelected = JSON.parse(usersSelected);
					if (isEachUserValid(usersSelected)) {
						return true;
					} else {
						res.status(403).json({message: 'There is any user with a invalid type'});
					}
				} else {
					res.status(403).json({message: 'The users do not have a valid type'});
				}
			} else {
				res.status(403).json({message: `The group name is required (max ${name_limitChar} characters)`});
			}
		} else {
			res.status(403).json({message: 'You must be logged in to create a new group'});
		}
	}

	const createNewGroup = (usersFromList) => {
		newGroup = new Group({
			groupName,
			owner
		})

		if (usersFromList) {
			newGroup.users = usersFromList
		}
		return newGroup;
	}

	const saveGroup = (group) => {
		newGroup.save()
		  	.then((group) => {
		 		res.status(200).json({group})
		  	})
		  	.catch(e => next(e));
	}

	const groupParams = [owner, groupName, usersSelected];

	if (isGroupValid(...groupParams)) {
		usersSelected = JSON.parse(usersSelected);

		Group.find({owner}).populate('users', {username:1, email:1})
			.then((groups) => {
				let totalUsers = [];
				let usersFromList = []; //users with 'ID' who exist in the DDBB
				let usersFromForm = []; //users without 'ID' who can exist or not in the DDBB;
				let totalGroupsNames = [];

				// total of users of this owner
				if (groups && groups.length > 0) {
					let group;
					for (let i = 0; i < groups.length; i++) {
						group = groups[i];
						console.log('GRUPO', group);
						totalGroupsNames.push(group.groupName);
						if (group.users.length > 0) {
							for (let j = 0; j < group.users.length; j++ ) {
								totalUsers.push(group.users[j]);
							}
						}
					}
					totalUsers = _.uniq(totalUsers);
					
					if (totalUsers.length > 0) {
						let totalUsersId = totalUsers.map((user) => {
							user = user.toObject();
							if (Object.prototype.hasOwnProperty.call(user, '_id')) {
								return (user._id.toString());
							} else {
								console.log('This user of the owner does not have an _id')
							}
						});
						
						for (let i = 0; i < usersSelected.length; i++) {
							console.log("It is a user FROM THE LIST because it has 'ID'");
							
							if (usersSelected[i].hasOwnProperty('_id')) {
								if (totalUsersId.includes(usersSelected[i]._id)) {
									usersFromList.push(usersSelected[i]);
								} else {
									res.status(403).json({message: `The selected user '${userSelected.username}' has not valid 'id'`});
								}

							} else {
								console.log("It is a NEW USER FROM THE FORM because it doesn't have 'ID'");

								usersFromForm.push(usersSelected[i]);
							}
						}
					}

					let groupNameFound = totalGroupsNames.find((thisGroupName) => {
						return thisGroupName == groupName;
					})

					if (groupNameFound) {
						res.status(403).json({message: `You already have a group with the name '${groupName}'`});
					} else {
						//newGroup = createNewGroup(usersFromList); //??
						newGroup = createNewGroup(null);
						saveGroup(newGroup);
					}

					//SI HAY USUARIOS EN EL LISTADO //(users con ID)
					if (usersFromList && usersFromList.length > 0) {

						if (!process.env.GMAIL_USER || ! process.env.GMAIL_PASSW ) {
						 	throw new Error("You have to configure mail credentials in .private.env file.");
						}

						let newRequest; 

						for (var i = 0; i < usersFromList.length; i++) {
							const publicUrl = process.env.PUBLIC_URL;
							const port = process.env.PORT;
							let guest = usersFromList[i];
							let confirmationCode = encodeURI(bcrypt.hashSync(guest.username, salt)).replace("/", "");
							let subject = `Hi! ${guest.username}, '${owner.username}' has invited you to join the group '${groupName}' `;
							let template = hbs.compile(fs.readFileSync(emailTemplate).toString());
							let temporaryPassw = Math.random().toString(36).slice(-8);
							let html = template({owner, user:guest, groupName, confirmationCode, publicUrl, temporaryPassw});

							newRequest = new Request({
								owner,
								guest,
								group: newGroup,
								status: 'pending',
								confirmationCode
							});

							newRequest.save()
								.then(request => {
									subject;
									template;
									html;
									return sendMail(guest.email, subject, html)
								})
								.then(() => {
									//res.status(403).json({message: `Email sent`});
								})
								.catch(e => next(e));
						}
					}
				} else {
					console.log('This user has no group yet');
					newGroup = createNewGroup(usersFromList);
					saveGroup(newGroup);
				}
			})
			.catch(e => next(e));
	}

});


router.get('/confirm/:confirmCode', (req, res, next) => {
	let confirmationCode = req.params.confirmCode;
	let status = req.query.status;

	if (status === 'accepted') {
		Request.findOneAndUpdate({confirmationCode}, {status}, {new:true}).populate('guest').populate('group')
			.then((request) => {
				User.findById(request.guest._id)
					.then((guestAccepted) => {

						Group.findByIdAndUpdate(request.group._id, {users: guestAccepted}, {new:true})
							.then((group) => {
								console.log(`${guestAccepted.username} added to the group ${group.groupName}`);
								//Request.findByIdAndDelete(request._id);
							})
							.catch(e => next(e));
					})
					.catch(e => next(e)); //SI EL USUARIO QUE HA ACEPTADO LA INVITACION NO ESTÁ EN LA BBDD
			})
			.catch(e => next(e));
	} else if(status === 'rejected') {
		Request.findOneAndUpdate({confirmationCode}, {status}, {new:true}).populate('guest')
			.then((request) => {
				User.findById(request.guest._id)
					.then((guestRejected) => {
						console.log(`${guestRejected.username} rejected the invitation to the group`);
						Request.findByIdAndDelete(request._id);
					})
					.catch(e => next(e));
			})
			.catch(e => next(e));

	}

})

//C(R)UD -> Retrieve ALL Groups of an User
router.get('/groups', (req, res, next) => {
	const owner = req.user;
	Group.find({owner}).sort({name:1})
		.then((groups) => {
			res.status(200).json({groups});
		})
		.catch(e => next(e));
})

module.exports = router;
