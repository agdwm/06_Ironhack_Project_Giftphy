const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Gift = require('../../models/Gift');


// (C)RUD -> Create a NEW Gift
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	const { giftName, giftPic, buyUrl, latitude, longitude, board } = req.body;
	let user = req.user._id;

	const newGift = new Gift({ 
		giftName, 
		giftPic, 
		buyUrl, 
		location: {
			type: 'Point',
			coordinates: [Number(latitude), Number(longitude)]
		}, 
		//board 
	});

	newGift.save()
		.then((gift) => {
			res.status(200).json({gift})
		})
		.catch(e => next(e));
})

module.exports = router;