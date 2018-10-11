const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
const moment = require('moment');
const User = require('../../models/User');

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

//C(R)UD -> Retrieve One
// router.get('/', ensureLoggedIn(), (req, res) => {
// 	console.log('USUARIO', req.user);
// 	User.findOne({ user: req.user })
// 		.then(user => {
// 			res.status(200).json({user:user, message: 'Retrieved user'})
// 		})
// 		.catch(e => next(e));
// })

router.get('/:id', ensureLoggedIn(), (req, res) => {
	const {id} = req.params;

	User.findOne({ _id: id})
		.then(user => {
			res.status(200).json({user:user, message: 'Retrieved user'})
		})
		.catch(e => next(e));
})

// EDIT
//User.findOneAndUpdate({ user: req.user }
router.patch('/edit/:id', ensureLoggedIn(), (req, res, next) => {
	const {id} = req.params;
	const {username, specialDates} = req.body;

	const specialDatesFormatted = specialDates.map((date) => {
		let key = Object.keys(date).toString();
		let val = new Date(Object.values(date));
		let dateFormatted = {[key] : val}
		return dateFormatted;
	})
	

	User.findByIdAndUpdate({ _id: id }, {
		username,
		specialDates:specialDatesFormatted
	}, {new:true})
		.then(updatedUser => login(req, updatedUser)) 
		.then(user => res.status(201).json({user:user, message: 'User updated'}))
		.catch(e => next(e));
});

//UPLOAD FILE
router.post('/upload/', ensureLoggedIn(), uploadCloud.single('profilePic'), (req, res, next) => {
	console.log(req.params);
	res.json(req.file)
});

module.exports = router;