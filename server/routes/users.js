const express = require('express');
const router = express.Router();
const { ensureLoggedIn, ensureLoggedOut } = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
const User = require('../../models/User');


//C(R)UD -> Retrieve All
router.get('/', ensureLoggedIn(), (req, res) => {
	User.find({})
		.then(users => {
			res.status(200).json({users:users, message: 'Retrieved users'})
		})
		.catch(e => next(e));
})

//C(R)UD -> Retrieve One
router.get('/:id', ensureLoggedIn(), (req, res) => {
	const {id} = req.params;

	User.findById({_id: id})
		.then(user => {
			res.status(200).json({user:user, message: 'Retrieved user'})
		})
		.catch(e => next(e));
})

// EDIT
router.put('/edit/:id', ensureLoggedIn(), (req, res, next) => {
	const {id} = req.params;
	const {username} = req.body;
	User.findByIdAndUpdate({_id:id}, {username}, {new:true})
		.then( updatedUser => login(req, updatedUser)) 
		.then( user => res.status(201).json({user:user, message: 'User updated'}))
		.catch(e => next(e));
});

//UPLOAD FILE
router.post('/upload/', ensureLoggedIn(), uploadCloud.single('profilePic'), (req, res, next) => {
	console.log(req.params);
	res.json(req.file)
});

module.exports = router;