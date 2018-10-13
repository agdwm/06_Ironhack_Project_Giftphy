const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Board = require('../../models/Board');


// (C)RUD -> Create a NEW Board
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	const owner = req.user;
	const { boardName } = req.body;
	let { privacy } = req.body;
	const priv_allowed = ['public', 'restricted', 'private'];
	

	const isOwnerValid = (bOwner) => {
		if (bOwner && Object.prototype.toString.call(bOwner) === '[object Object]') {
			return true;
		} else {
			return false;
		}
	}

	const isBoardNameValid = (bName) => {
		return bName && bName !== '';
	}

	const isPrivacyValid = (bPriv) => {
		if (!bPriv || bPriv === '') {
			privacy = 'public';
			return true;
		} else {
			if (typeof bPriv === 'string') {
				if (priv_allowed.includes(bPriv)) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	}

	const isBoardValid = (owner, boardName, privacy) => {
		if (isOwnerValid(owner)) {
			if (isBoardNameValid(boardName)) {
				if (isPrivacyValid(privacy)) {
					return true;
				} else {
					res.status(403).json({message: `The privacy must be: 'public', 'private' or 'restricted'`});
				}
			} else {
				res.status(403).json({message: 'The board name is required'});
			}
		} else {
			res.status(403).json({message: 'You must be logged in to create a new board'});
		}
	}

	const boardParams = [owner, boardName, privacy]

	if (isBoardValid(...boardParams)) {
		
	}


// 	const newBoard = new Board({ boardName, owner, privacy });

// 	newBoard.save()
// 		.then((board) => {
// 			res.status(200).json({board})
// 		})
// 		.catch(e => next(e));
// })
});



//C(R)UD -> Retrieve ALL (public, private) boards sorted desc
router.get('/:pricacy', (req, res, next) => {
	const {privacy} = req.params;

	Board.find({privacy}).sort({updated_at:-1}).populate('owner')
		.then((boards) => {
			//boardName, GIFTS, owner, GUESTS
			console.log('BOARDS', boards);
			res.status(200).json({boards});
		})
		.catch(e => next(e));
})


//C(R)UD -> Retrieve ALL boards of an user (skip && limit)
//Created in the profile route.

//C(R)UD -> Retrieve ALL Boards of a Group
router.get('/:groupName', (req, res, next) => {
	const {groupName} = req.params;
	
	Board.find({group:groupName})
		.then((boards) => {
			res.status(200).json({boards});
		})
		.catch(e => next(e));
});

module.exports = router;