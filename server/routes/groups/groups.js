const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const _ = require('lodash');
const colors = require('colors');

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
	let usersToInvite = req.body.users;
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

	const isGroupValid = (owner, groupName, usersToInvite) => {
		if (isOwnerValid(owner)) {
			if (isGroupNameValid(groupName)) {
				if (areUsersValid(usersToInvite)) {
					usersToInvite = JSON.parse(usersToInvite);
					if (isEachUserValid(usersToInvite)) {
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

	const createNewGroup = (finalUsers) => {
		newGroup = new Group({
			groupName,
			owner
		})

		if (finalUsers) {
			newGroup.users = finalUsers
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

	const groupParams = [owner, groupName, usersToInvite];

	if (isGroupValid(...groupParams)) {
		usersToInvite = JSON.parse(usersToInvite);

		Group.find({owner}).populate('users', {username:1, email:1})
			.then((groups) => {

				// total of users of this owner
				if (groups && groups.length > 0) {

					let totalGroupsNames = [];
					let totalGroupsUsers = [];
					let usersFromList = []; //users with 'ID' who exist in the DDBB
					let usersFromForm = []; //users without 'ID' who can exist or not in the DDBB;
					let registeredUsers = [];
					let unRegisteredUsers = [];
					let finalUsers = [];
					//let userGroup;

					for (let i = 0; i < groups.length; i++) {
						totalGroupsNames.push(groups[i].groupName);
						if (groups[i].users && groups[i].users.length > 0) {
							for (let j = 0; j < groups[i].users.length; j++ ) {
								totalGroupsUsers.push(groups[i].users[j]);
							}
						}
					}

					totalGroupsUsers = _.uniq(totalGroupsUsers);
					
					if (totalGroupsUsers && totalGroupsUsers.length > 0) {
						let totalGroupsUsersId = totalGroupsUsers.map((user) => {
							user = user.toObject();
							//extra comprobation
							if (Object.prototype.hasOwnProperty.call(user, '_id')) {
								return (user._id.toString());
							} else {
								console.log('This user of the OWNER does not have an _id')
							}
						});
						let checkEmails;

						for (let i = 0; i < usersToInvite.length; i++) {
							//It is a user FROM THE LIST because it has 'ID'
							if (usersToInvite[i].hasOwnProperty('_id')) {
								if (totalGroupsUsersId.includes(usersToInvite[i]._id)) {
									usersFromList.push(usersToInvite[i]);
								} else {
									res.status(403).json({message: `The selected user '${userSelected.username}' has not valid 'id'`});
								}
							} else {
								//It is a NEW USER FROM THE FORM because it doesn't have 'ID'
								console.log(colors.cyan('EMAIL', usersToInvite[i].email));
								checkEmails = Promise.all([User.findOne({email:usersToInvite[i].email})
									.then((user) => {
										if (user) {
											console.log(colors.green('SI esta en DDBB', user))
											registeredUsers.push(user);
										} else {
											console.log(colors.red('NO esta en DDBB', usersToInvite[i]));
											unRegisteredUsers.push(usersToInvite[i]);
										}
									})
									.catch(e => next(e))
								])
							}
						}

						checkEmails
							.then(()=>{
								registeredUsers = usersFromList.concat(registeredUsers);
								console.log(colors.magenta('UNREGISTEREDUSERS ====>', unRegisteredUsers));
							})
							.catch(e => next(e))

						

						if (unRegisteredUsers && unRegisteredUsers.length > 0) {
							let newUser;
							let unRegisteredUsersWithId = unRegisteredUsers.map((user) => {
								
								newUser = new User({
									username: user.username,
									password: user.username,
									email: user.email
								});

								return newUser.save()
									.then(newUser => {
										return newUser;
									})
									.catch(e => next(e));
							})
							console.log('unRegisteredUsersWithId =========================>', unRegisteredUsersWithId);
						}
						// usersFromForm.push(newUser);
					}

					debugger;

					//Check the group name
					let groupNameFound = totalGroupsNames.find((thisGroupName) => {
						return thisGroupName == groupName;
					})

					if (groupNameFound) {
						res.status(403).json({message: `You already have a group with the name '${groupName}'`});
					} else {
						newGroup = createNewGroup(null);
						saveGroup(newGroup);
					}

						
					finalUsers = usersFromList.concat(usersFromForm);

					if (finalUsers && finalUsers.length > 0) {

						if (!process.env.GMAIL_USER || ! process.env.GMAIL_PASSW ) {
						 	throw new Error("You have to configure mail credentials in .private.env file.");
						}

						let newRequest; 

						for (var i = 0; i < finalUsers.length; i++) {
							const publicUrl = process.env.PUBLIC_URL;
							const port = process.env.PORT;
							let guest = finalUsers[i];
							let confirmationCode = encodeURI(bcrypt.hashSync(guest.username, salt)).replace("/", "");
							let subject = `Hi! ${guest.username}, '${owner.username}' has invited you to join the group '${groupName}' `;
							let template = hbs.compile(fs.readFileSync(emailTemplate).toString());
							//como guest ahora tiene ID tengo que hacer la condicion diferente en el handlebars
							let html = template({owner, user:guest, groupName, confirmationCode, publicUrl, port});
							
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
					} else {
						console.log('This user has any group but not users in these groups');
					}
				} else {
					console.log('This user has no group yet');
					newGroup = createNewGroup(finalUsers);
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
				let user;
				//si el usuario tiene ID
				if (request.guest._id) {
					User.findById(request.guest._id)
						.then((guestAccepted) => {		
							user = guestAccepted;
						})
						.catch(e => next(e));
				//si el usuario NO tiene ID
				} else {
					// let newUserAccepted = new User({
					// 	username: request.guest.username,
					// 	password: request.guest.username,
					// 	email: request.guest.email
					// });

					// newUserAccepted.save()
					// 	.then(newUserAccepted => {
					// 		user = newUserAccepted;
					// 	})
					// 	.catch(e => next(e));
				}
				console.log('USER------------------------>', user);

				Group.findByIdAndUpdate(request.group._id, {users: user}, {new:true})
					.then((group) => {
						console.log(`${user.username} added to the group ${group.groupName}`);
						//Request.findByIdAndDelete(request._id);
					})
					.catch(e => next(e));
			})
			.catch(e => next(e));

	} else if(status === 'rejected') {
		Request.findOneAndUpdate({confirmationCode}, {status}, {new:true}).populate('guest')
			.then((request) => {
				User.findById(request.guest._id)
					.then((guestRejected) => {
						console.log(`${guestRejected.username} rejected the invitation to the group`);
						//Request.findByIdAndDelete(request._id);
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
