const express = require('express');
const { ensureLoggedIn, ensureLoggedOut } = require('connect-ensure-login');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');


// EDIT
router.put('/edit/:id', ensureLoggedIn(), (req, res, next) => {
	const {id} = req.params;
	const {username} = req.body;
	User.findByIdAndUpdate({_id:id}, {username}, {new:true})
		.then( updatedUser => login(req, updatedUser)) 
		.then( user => res.status(201).json({user:user, message: 'User updated'}))
		.catch(e => next(e));
});

//UPLOAD
// router.post('/upload', ensureLoggedIn(), upload.single('profile-pic'), (req, res, next) => {

// });