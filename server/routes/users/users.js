const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const User = require('../../models/User');


//C(R)UD -> Retrieve All
router.get('/', ensureLoggedIn(), (req, res) => {
	User.find({})
		.then(users => {
			res.status(200).json({users:users, message: 'Retrieved users'})
		})
		.catch(e => next(e));
})

module.exports = router;