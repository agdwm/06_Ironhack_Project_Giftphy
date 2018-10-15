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
	const {groupName} = req.body;


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

	const groupParams = [owner, groupName, usersSelected];

	if (isGroupValid(...groupParams)) {
		usersSelected = JSON.parse(usersSelected);

		Group.find({owner}).populate('users', {username:1, email:1})
			.then((groups) => {
				let totalUsers = [];
				let finalUsers = [];

				// total of users of this owner
				if (groups && groups.length > 0) {
					let group;
					for (let i = 0; i < groups.length; i++) {
						group = groups[i];
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
									//FINALUSERS = FinalsUser to send an email
									finalUsers.push(usersSelected[i]);
								} else {
									res.status(403).json({message: `The selected user '${userSelected.username}' has not valid 'id'`});
								}


							} else {
								console.log("It is a NEW USER because it doesn't have 'ID'");

								// if (!process.env.GMAIL_USER || ! process.env.GMAIL_PASSW ) {
								// 	throw new Error("You have to configure mail credentials in .private.env file.");
								// }
								// const salt = bcrypt.genSaltSync(bcryptSalt);
								// const hashUsername = encodeURI(bcrypt.hashSync(username1, salt)).replace("/", "");
								// //const temporaryPassw = Math.random().toString(36).slice(-8);

								// const {username1, email1, message1} = req.body;
								
								// // const newUser = new User({
								// // 	username: username1,
								// // 	confirmationCode: hashUsername,
								// // 	email: email1,
								// // 	password: temporaryPassw
								// // })


								// let foundEmail = totalUsers.find((thisUser) => {
								// 	return thisUser.email == newUser.email;
								// })

								// // The user is in the list. Select it from 
								// if (foundEmail) {
								// 	res.status(403).json({message: `You already have a user with the email '${newUser.email}' in the list`});
								// }

								// newUser.save()
								// 	.then(user => {
								// 		let subject = `Hi! ${newUser.username} ${owner.username} has invited you to join the group '${groupName}' `;
								// 		let template = hbs.compile(fs.readFileSync('./views/email/email.hbs').toString());
								// 		let html = template({user:user});
								// 		return sendMail(email1, subject, html);
								// 	})
								// 	.then(() => {
								// 		//res.redirect("/");
								// 		res.status(201).json(newUser)
								// 	})
								// 	.catch(err => {
								// 		//res.render("auth/signup", console.log(err));
								// 	})
							}
						}
					}

					let groupNameFound = groups.find((thisGroup) => {
						return thisGroup.groupName == groupName;
					})
					
					if (groupNameFound) {
						res.status(403).json({message: `You already have a group with the name '${groupName}'`});
					} else {
						//newGroup = createNewGroup(finalUsers); //??
						newGroup = createNewGroup(null);
						saveGroup(newGroup);
					}

					//usuarios a agregar al grupo y a los que tenemos que enviarles un email
					if (finalUsers && finalUsers.length > 0) {

						if (!process.env.GMAIL_USER || ! process.env.GMAIL_PASSW ) {
						 	throw new Error("You have to configure mail credentials in .private.env file.");
						}

						const salt = bcrypt.genSaltSync(bcryptSalt);
						let newRequest; 

						for (var i = 0; i < finalUsers.length; i++) {
							console.log('FINAL_USER---------', finalUsers[i]);
							let guest = finalUsers[i];
							let confirmationCode = encodeURI(bcrypt.hashSync(guest.username, salt)).replace("/", "");
							let subject = `Hi! ${guest.username}, '${owner.username}' has invited you to join the group '${groupName}' `;
							let template = hbs.compile(fs.readFileSync(emailTemplate).toString());
							let html = template({owner, user:guest, groupName, confirmationCode});

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
				User.findById(request.guest._id)
					.then((guestAccepted) => {
						Group.findByIdAndUpdate(request.group._id, {users: guestAccepted}, {new:true})
							.then((group) => {
								console.log(`${guestAccepted.username} added to the group ${group.groupName}`);
								//eliminar la request una vez hemos añadido el usuario al grupo
								//Request.findByIdAndDelete(request._id);
							})
							.catch(e => next(e));
					})
					.catch(e => next(e));
			})
			.catch(e => next(e));
			
		
	} else if(status === 'rejected') {
		//eliminamos la request ya que el usuario la ha rechazado
		//
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
