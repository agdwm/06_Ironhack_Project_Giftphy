const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Group = require('../../models/Group');

// (C)RUD -> Create a NEW Group
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	//name, owner, (users)??
	const {name} = req.body;
	let owner = req.user;

	const newGroup = new Group({ 
		name, 
		owner
	});

	newGroup.save()
		.then((group) => {
			res.status(200).json({group})
		})
		.catch(e => next(e));
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
