const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
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
	const {username, specialDates, profilePic} = req.body;
	
	const specialDatesFormatted = specialDates.map((date) => {
		let key = Object.keys(date).toString();
		let val = new Date(Object.values(date));
		let dateFormatted = {[key] : val}
		return dateFormatted;
	})
	
	User.findByIdAndUpdate({ _id: id }, {
		username,
		specialDates: specialDatesFormatted,
		profilePic
	}, {new:true})
		.then(updatedUser => login(req, updatedUser)) 
		.then(user => res.status(201).json({user:user, message: 'User updated'}))
		.catch(e => next(e));
});

//UPLOAD FILE
router.post('/upload/', ensureLoggedIn(), uploadCloud.single('profilePic'), (req, res, next) => {
	console.log(req.params);
	res.json(req.file) //all the cloudinary fields
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