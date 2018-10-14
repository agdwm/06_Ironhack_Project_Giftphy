const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Group = require('../../models/Group');

// (C)RUD -> Create a NEW Group
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	//name, owner, (users)??
	const {groupName} = req.body;
	let usersSelected = req.body.users;
	// [{"username":"luis", "email":"lugonperez@gmail.com"},{"username":"sara", "email":"sara@gmail.com"}]
	let owner = req.user;
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
		const newGroup = new Group({
			groupName,
			owner,
			users: finalUsers
		})
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
							if (usersSelected[i].hasOwnProperty('_id')) {
								if (totalUsersId.includes(usersSelected[i]._id)) {
									finalUsers.push(usersSelected[i]);
								} else {
									res.status(403).json({message: `The selected user '${userSelected.username}' is not valid`});
								}
							} else {
								console.log("IT IS A NEW USER BECAUSE IT DOES NOT 'ID'");
								// Send an email
							}
						}
					}

					// CHEQUEAR que el usuario no tenga ya un grupo con este nombre
					console.log(groups);
					let groupNameFound = groups.find((thisGroup) => {
						return thisGroup.groupName == groupName;
					})

					
					if (groupNameFound) {
						res.status(403).json({message: `You already have a group with the name '${groupName}'`});
					} else {
						newGroup = createNewGroup(finalUsers);
						saveGroup(newGroup);
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
