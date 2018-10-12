const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
const Gift = require('../../models/Gift');
const Board = require('../../models/Board');

// (C)RUD -> Create a NEW Gift
router.post('/new', ensureLoggedIn(), uploadCloud.single('giftPic'), (req, res, next) => {
	let user = req.user;
	const { giftName, buyUrl } = req.body;
	//latitude: 40.4195492 longitude: -3.7048831,17
	let { latitude, longitude } = req.body;
	let boardSelected = req.body.board;
	boardSelected = JSON.parse(boardSelected);
	let board = null;
	let giftPic = null;
	

	if (!giftName && giftName === '') {	
		res.status(403).json({message: 'The gift name is required'}) 
	}

	if (req.file) {	
		giftPic = req.file.secure_url; 
	}

	if (latitude && latitude !== '' && longitude && longitude !== '') {
		latitude = parseFloat(latitude);
		longitude = parseFloat(longitude);
	}
	

	if (boardSelected) {
		Board.find({owner:user})
		.then(boards => {
			//res.status(200).json({boards})
			boards.forEach((thisBoard) => {
				if (thisBoard._id == boardSelected._id) {
					board = boardSelected
				}
			})

			if (board !== null) {
				const newGift = new Gift({
					giftName, 
					giftPic,
					buyUrl,
					location: {
						type: 'Point',
						coordinates: [Number(latitude), Number(longitude)]
					}, 
					board
				});

				newGift.save()
					.then((gift) => {
						res.status(200).json({gift})
					})
					.catch(e => next(e));
			}else{
				throw new Error('The board is required');
			}
		})
		.catch(e => next(e));
	}
})

module.exports = router;