const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
const User = require('../../models/User');
const moment = require('moment');

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

router.get('/:id', ensureLoggedIn(), (req, res) => {
	const {id} = req.params;

	User.findOne({ _id: id})
		.then(user => {
			res.status(200).json({user:user, message: 'Retrieved user'})
		})
		.catch(e => next(e));
})

// EDIT
router.patch('/edit/', ensureLoggedIn(), uploadCloud.single('profilePic'), (req, res, next) => {
	const id = req.user._id;
	const {username} = req.body;
	let {specialDates} = req.body;
	const profilePic = req.file.secure_url;
	let specialDatesFormatted = [];

	//FORMAT: [{"birthday":"1983-06-28"} ,{"aniversaire":"2005-11-26"}]
	if (specialDates && specialDates !== '') {
		specialDatesFormatted = JSON.parse(specialDates).map((date) => {
			//if date is an Object
			if (Object.prototype.toString.call(date) === '[object Object]') {
				let key = Object.keys(date).toString();
				let val;
				if (moment(date).isValid()) {
					val = new Date(Object.values(date));
				} else {
					throw new Error('The date format is not valid'); 
				}
				let dateFormatted = {[key] : val}
				return dateFormatted;
			}
		})
	}

	User.findOne({username})
		.then((user) => {
			if (user && user._id !== id) {
				return res.status(403).json({message: 'This username already exists'})
			}
			User.findByIdAndUpdate(id, {
				username,
				specialDates: specialDatesFormatted,
				profilePic
			}, {new:true})
				.then(updatedUser => login(req, updatedUser)) 
				.then(user => res.status(201).json({user:user, message: 'User updated'}))
				.catch(e => next(e));
			
		})
		.catch(e => next(e));
});

//C(R)UD -> Retrieve ALL boards of an user (skip && limit)
router.get('/boards', (req, res, next) => {
	Board.find({ owner: req.user }).sort({boardName:1})
		.then((boards) => {
			res.status(200).json({boards});
		})
		.catch(e => next(e));
})

module.exports = router;