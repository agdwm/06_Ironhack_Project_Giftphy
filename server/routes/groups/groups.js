const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Group = require('../../models/Group');

// (C)RUD -> Create a NEW Group
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	//name, owner, (users)??
	const {groupName} = req.body;
	let usersSelected = req.body.users;
	console.log('GROUPNAME', groupName)
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
			console.log(gUsers)
			try {
				JSON.parse(gUsers)
			} catch(err) {
				res.status(403).json({message: 'Group must be an Array of objects'}) 
			}
			return true

			// console.log('USER', Object.prototype.toString.call(gUsers));
			// if (Object.prototype.toString.call(gUsers) === '[object Array]') {
			// 	invalidUser = users.find((gUser) => {
			// 		console.log('USER', Object.prototype.toString.call(gUser));
			// 		return Object.prototype.toString.call(gUser) != '[object Object]';
			// 	})

			// 	if (invalidUser) {
			// 		console.log('There are some users with an incorrect type');
			// 		return false;
			// 	}else {
			// 		return true;
			// 	}
			// } else {
			// 	return false;
			// }
		} else {
			console.log('There are not users selected');
			return true;
		}
	} 

	const isEachUserValid = (usersParsed) => {
		if (Object.prototype.toString.call(usersParsed) === '[object Array]') {
			console.log('YUJU ARRAY');
			invalidUser = usersParsed.find((gUser) => {
				console.log('USER', Object.prototype.toString.call(gUser));
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
						res.status(403).json({message: 'The is any user with a invalid type'});
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

	const groupParams = [owner, groupName, usersSelected];

	if (isGroupValid(...groupParams)) {

	}
	// const newGroup = new Group({ 
	// 	groupName,
	// 	owner
	// });

	// newGroup.save()
	// 	.then((group) => {
	// 		res.status(200).json({group})
	// 	})
	// 	.catch(e => next(e));
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
