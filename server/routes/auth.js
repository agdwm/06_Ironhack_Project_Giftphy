const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureLoggedIn, ensureLoggedOut } = require('connect-ensure-login');
const User = require('../models/User');

// Bcrypt to encrypt passwords
const bcrypt = require('bcrypt');


const login = (req, user) => {
	return new Promise((resolve, reject) => {
		req.login(user, err => {
			if (err) {
				reject(new Error('Something went wrong'))
			} else {
				resolve(user);
			}
		})
	})
}

// SIGNUP
router.post('/signup', ensureLoggedOut(), (req, res, next) => {
	
	let {username,password, email} = req.body;
	const email_pattern = new RegExp("/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i");

	// Check for non empty user or password
	if (!username || !password || !email) {
		next(new Error('You must provide valid credentials'));
		return;
	} else if(!email_pattern.test(email)){
		next(new Error('You must provide a valid email'));
		return;
	} else {
		username = username.trim();
		email = email.toLowerCase().trim();
		password = password.toLowerCase().trim();
	}
  
	// Check if user exists in DB
	User.findOne({ $or: [{username: username}, {email: email}] })
		.then( foundUser => {
			if (foundUser) {
				if (foundUser.username && foundUser.username === username) {
					throw new Error('Username already exists'); 
						
				} else if(foundUser.email && foundUser.email === email) {
					throw new Error('Email already exists');     
				}
			}

			const salt = bcrypt.genSaltSync(10);
			const hashPass = bcrypt.hashSync(password, salt);

			let newUser = new User({
				username,
				password: hashPass,
				email
			});

			newUser.save()
				.then( user => res.status(201).json({user:user, message: 'User created'}))
				.catch(e => next(e));
		}).catch(e => next(e));
});

// LOGIN
router.post('/login', ensureLoggedOut(), (req, res, next) => {
	passport.authenticate('local', (err, theUser, failureDetails) => {
		// Check for errors
		if (err) next(new Error('Something went wrong')); 
		if (!theUser) next(failureDetails)

		// Return user and logged in
		login(req, theUser)
			.then(user => res.status(200).json({user:req.user, message: 'User logged'}))
			.catch(e => next(e));
	})(req, res, next);
});

// LOGGEDIN
router.get('/loggedin/', (req, res, next) => {
	if (req.user) {
	  	res.status(200).json({user:req.user, message:'User Logged in'});
	} else {
	  	next(new Error('Not logged in'));
	}
})

// LOGOUT
router.get('/logout', ensureLoggedIn(), (req,res) => {
  	req.logout();
  	res.status(200).json({message:'User logged out'})
});

router.use((err, req, res, next) => {
  	res.status(500).json({ message: err.message });
})

module.exports = router;