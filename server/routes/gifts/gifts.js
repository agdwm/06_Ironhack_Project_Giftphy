const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const uploadCloud = require('../../config/cloudinary');
const Gift = require('../../models/Gift');
const Board = require('../../models/Board');

// (C)RUD -> Create a NEW Gift
router.post('/new', ensureLoggedIn(), uploadCloud.single('giftPic'), (req, res, next) => {
	const owner = req.user;
	let boardSelected = req.body.board;
	let board = null;
	let newGift = null;
	const url_pattern = new RegExp('((http|https)(:\/\/))?([a-zA-Z0-9]+[.]{1}){2}[a-zA-z0-9]+(\/{1}[a-zA-Z0-9]+)*\/?', 'i');
	const { giftName, giftUrl, description } = req.body;
	let { latitude, longitude, priority, status } = req.body; //latitude: 40.4195492 || longitude: -3.7048831,17
	let giftPic = null;
	const image_default = 'images/default-gift-500.png';
	//ALLOWED VALUES
	const desc_limitWords = 400;
	const name_limitChar = 50;
	const priority_allowed = [1, 2, 3, 4, 5];
	const status_allowed = ['checked', 'unchecked'];
	
	// GIFTS VALIDATIONS
	const isGiftNameValid = (gName) => { 
		if (gName && gName !== '') {
			gName = gName.trim().replace(/[ ]{2,}/gi,' ');
			if (gName.split(/\s+/).length <= name_limitWords) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	const isGiftPicValid = (gPic) => { 
		if (gPic && gPic !== '') {
			if (req.file && req.file.secure_url) {
				giftPic = req.file.secure_url;
				return true;
			}
		} else {
			giftPic = image_default;
			return true;
		}
	}

	const isGiftUrlValid = (gUrl) => { return url_pattern.test(gUrl); }
	
	const isGiftLatValid = (lat) => {
		if (lat && lat !== '') {
			latitude = parseFloat(latitude);
			return parseFloat(lat);
		}  else {
			console.log('Latitude is not defined')
		}
	}
	const isGiftLongValid = (long) => {
		if (long && long !== '' ) {
			longitude = parseFloat(longitude);
			return parseFloat(long);
		} else {
			console.log('Longitude is not defined')
		}
	}
	const isGiftDescValid = (desc) => {
		if (gName && gName !== '') {
			gName = gName.trim().replace(/[ ]{2,}/gi,' ');
			if (gName.split('').length <= name_limitChar) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	const isGiftPriorityValid = (prior) => {
		if (prior && prior !== '' ) {
			if (typeof prior === 'string') {
				priority = parseInt(priority[0]);
				if (priority_allowed.includes(priority)) {
					return true;
				}
			} else {
				return false
			}
			
		} else {
			console.log('The priority is empty');
		}
	}
	const isGiftStatusValid = (stat) => {
		if (!stat || stat === '' ) {
			status = 'unchecked';
			return true;
		} else {
			if (typeof stat === 'string') {
				if (status_allowed.includes(stat)){
					return true
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	}

	// GIFT VALID ?
	const isGiftValid = (giftName, giftPic, giftUrl, latitude, longitude, description, priority, status) => {
		if (isGiftNameValid(giftName)) {
			if (isGiftPicValid(giftPic)) {
				if (isGiftUrlValid(giftUrl)) {
					if (isGiftLatValid(latitude) && isGiftLongValid(longitude)) {
						if (isGiftDescValid(description)) {
							if (isGiftPriorityValid(priority)) {
								if (isGiftStatusValid(status)) {
								 	return true;
								} else {
									res.status(403).json({message: `The status must be: 'checked', 'unchecked'`});
								}
							} else{
								res.status(403).json({message: `The priority must be a number between 1 - 5`});
							}
						} else {
							res.status(403).json({message: `The description exceeds the limit of words allowed (${desc_limitWords})`});
						}
					} else {
						res.status(403).json({message: 'Latitud or longitud must be valid values'});
					}
				} else {
					res.status(403).json({message: 'The shop url must be an url valid'});
				}
			} else {
				res.status(403).json({message: 'The gift image must have a valid type'});
			}
		} else {
			res.status(403).json({message: `The gift name is required (max ${name_limitChar} characters)`});
		}
	}

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

	const createNewBoard = (boardSelected) => {
		const newBoard = new Board({ 
			boardName: boardSelected.boardName,
			owner,
			privacy: boardSelected.privacy
			//group
		});
		return newBoard;
	}

	const createGift = (board) => {

		const newGift = new Gift({
			giftName,
			giftPic,
			giftUrl,
			location: {
				type: 'Point',
				coordinates: [Number(latitude), Number(longitude)]
			},
			description,
			priority,
			status,
			board
		});
		return newGift;
	}

	const saveGift = (gift) => {
		gift.save()
			.then((gift) => {
				res.status(201).json({gift})
			})
			.catch(e => next(e));
	}


	const giftParams = [giftName, giftPic, giftUrl, latitude, longitude, description, priority, status];
	
	if (isGiftValid(...giftParams)) {
		if (isBoardValid(boardSelected)) {
			boardSelected = JSON.parse(boardSelected);
			// It is one of the user's boards
			if (boardSelected._id) {
				// Check just in case
				Board.find({owner})
					.then(boards => {
						if (boards && boards.length !== 0) {
							board = boards.find((thisBoard) => {
								return thisBoard._id == boardSelected._id
							})
						}
						
						if (board) {
							//FILTER BOARD BY ID!!
							Gift.find({board:board._id}, {giftName: 1, _id:0})
								.then(thisGifts => {
									nameFound = thisGifts.find((thisGift) => {
										return thisGift.giftName == giftName;
									})

									if (nameFound) {
										res.status(403).json({message: 'There is already a gift with the same name on this board'});
									}
								})
								.catch(e => next(e));

							newGift = createGift(board);
							saveGift(newGift);
						} else {
							res.status(403).json({message: 'The selected board is not valid'});
						}
					})
					.catch(e => next(e));
			} else {
				// It is a new board
				const newBoard = createNewBoard(boardSelected);
				
				Board.find({owner})
					.then(boards => {
						//Does the user have a board with the same name?
						let boardFound;
						if (boards && boards.length !== 0) {
							boardFound = boards.find((thisBoard) => {
								return thisBoard.boardName == newBoard.boardName;
							})
						}

						if (boardFound) {
							res.status(403).json({message: 'You already have a board with this name'});
						} else {
							newBoard.save()
								.then((newBoard) => {
									newGift = createGift(newBoard);
									saveGift(newGift);
								})
								.catch(e => next(e));
						}
					})
					.catch(e => next(e));
			}
		}
	}
})

module.exports = router;