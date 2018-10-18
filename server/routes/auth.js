const bcrypt = require('bcrypt');
const { ensureLoggedIn, ensureLoggedOut } = require('connect-ensure-login');
const express = require('express');
const {Conflict, Forbidden} = require('http-errors')
const passport = require('passport');

const User = require('../models/User');


const router = express.Router();


// SIGNUP
router.post('/signup', ensureLoggedOut(), (req, res, next) => {
	
	let {username, password, email} = req.body;
	const email_pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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
	User.findOne({ $or: [{username}, {email}] })
		.then( foundUser => {
			if (foundUser) {
				throw new Conflict('Username or email already exists');
			}
			
			const salt = bcrypt.genSaltSync(10);
			const hashPass = bcrypt.hashSync(password, salt);

			return new User({
				username,
				password: hashPass,
				email
			}).save()
		})
		//.then( savedUser => login(req, savedUser)) // Login the user using passport
		.then((user) => {
			res.status(201).json({user:user, message: 'User created'})
		})	
		.catch(next);
});

// LOGIN
router.post('/login', ensureLoggedOut(), (req, res, next) => {
	//Only: "email" & "password"
	passport.authenticate('local', (err, user, failureDetails) => {
		// Check for errors
		if (err) { 
			return next(err); 
		}
		
		if (! user) {
			return res.status(401).json({ success : false, message : 'Authentication failed' });
		}

		// Return user and logged in
		req.logIn(user, (err) => {
			if (err) { 
				return next(err); 
			}
			return res.status(201).json({success : true, user, message: 'Authentication succeeded'})
		});
	})(req, res, next);
});

// LOGGEDIN
router.get('/loggedin', (req, res, next) => {
	if (req.user) {
	  	res.status(200).json({user:req.user, message:'User Logged in'});
	} else {
		//next(new Error('Not logged in'));
		res.status(200).json({message:'Not logged in'});
	}
})

// LOGOUT
router.get('/logout', ensureLoggedIn(), (req,res) => {
  	req.logout();
  	res.status(200).json({message:'User logged out'})
});


module.exports = router;