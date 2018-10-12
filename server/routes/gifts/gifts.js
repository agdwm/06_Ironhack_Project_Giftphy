const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
const Gift = require('../../models/Gift');
const Board = require('../../models/Board');

// (C)RUD -> Create a NEW Gift
router.post('/new', ensureLoggedIn(), uploadCloud.single('giftPic'), (req, res, next) => {
	let user = req.user;
	let boardSelected = req.body.board;
	const url_pattern = new RegExp("((http|https)(:\/\/))?([a-zA-Z0-9]+[.]{1}){2}[a-zA-z0-9]+(\/{1}[a-zA-Z0-9]+)*\/?", "i");
	const { giftName, buyUrl } = req.body;
	let { latitude, longitude } = req.body; //latitude: 40.4195492 || longitude: -3.7048831,17
	
	//let board = null;
	//let giftPic = null;
	
	const isGiftNameValid = (name) => {
		return name && name !== '';
	}
	const isBuyUrlValid = (url) => {
		return url_pattern.test(url);
	}
	const isLatValid = (lat) => {
		if (lat && lat !== '') {
			return parseFloat(lat);
		}  else {
			console.log('Latitude is not defined')
		}
	}
	const isLongValid = (long) => {
		if (long && long !== '' ) {
			return parseFloat(long);
		} else {
			console.log('Longitude is not defined')
		}
	}

	// 1. Validar Gift
	const isGiftValid = (giftName, buyUrl, latitude, longitude) => {
		if (isGiftNameValid(giftName)) {
			if (isBuyUrlValid(buyUrl)) {
				if (isLatValid(latitude) && isLongValid(longitude)) {
					latitude = parseFloat(latitude);
					longitude = parseFloat(longitude);
					return true;
				} else {
					res.status(403).json({message: 'Latitud or longitud must be valid values'})
				}
			} else {
				res.status(403).json({message: 'The shop url must be an url valid'})
			}
		} else {
			res.status(403).json({message: 'Gift name is required'})
		}
	}

	// 2. Validar Board
	const isBoardValid = (boardSelected) => {
		if (boardSelected && boardSelected !== '') {
			try {
				JSON.parse(boardSelected)
			} catch(err) {
				res.status(403).json({message: 'Board must be an object'}) 
			}
			return true
		} else {
			res.status(403).json({message: 'Board is required'}) 
		}
	}
	

	// 3. Guardar Regalo (guardar Board)
	if (isGiftValid(giftName, buyUrl, latitude, longitude)) {
		if (isBoardValid(boardSelected)) {
			console.log('SI VALID-----------', boardSelected);
			boardSelected = JSON.parse(boardSelected);
		}else{
			console.log('NOT VALID-----------', boardSelected);
		}
	} else{

	}
	
})


module.exports = router;