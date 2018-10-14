const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Board = require('../../models/Board');
const Group = require('../../models/Group');

// (C)RUD -> Create a NEW Board
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	const owner = req.user;
	let groupSelected = req.body.group;
	let group = null;
	const { boardName } = req.body;
	let { privacy } = req.body;
	const name_limitChar = 50;
	const priv_allowed = ['public', 'restricted', 'private'];

	const isOwnerValid = (bOwner) => {
		if (bOwner && Object.prototype.toString.call(bOwner) === '[object Object]') {
			return true;
		} else {
			return false;
		}
	}

	const isBoardNameValid = (bName) => {
		if (bName && bName !== '') {
			bName = bName.trim().replace(/[ ]{2,}/gi,' ');
			if (bName.split('').length <= name_limitChar) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
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
				res.status(403).json({message: `The board name is required (max ${name_limitChar} characters)`});
			}
		} else {
			res.status(403).json({message: 'You must be logged in to create a new board'});
		}
	}

	const isGroupValid = (groupSelected) => {
		if ( groupSelected && groupSelected !== '') {
			try {
				JSON.parse(groupSelected)
			} catch(err) {
				res.status(403).json({message: 'Group must be an object'}) 
			}
			return true;
		} else {
			console.log('There is not a group selected');
			return true;
		}
	}

	const createNewGroup = (groupSelected) => {
		const newGroup = new Group({
			groupName: groupSelected.groupName,
			owner
			//users
		})
		return newGroup;
	}

	const createBoard = (group) => {
		Board.find({owner})
			.then(boards => {
				if (boards && boards.length !== 0) {
					boardFound = boards.find((thisBoard) => {
						return thisBoard.boardName == boardName;
					})
				}
			})
			.catch(e => next(e));
		
		if (boardFound) {
			res.status(403).json({message: 'You already have a board with this name'});
		}

		const newBoard = new Board({
			boardName,
			owner,
			group,
			privacy
		})
		return newBoard;
	}

	const saveBoard = (board) => {
		board.save()
			.then((board) => {
				res.status(201).json({board})
			})
			.catch(e => next(e));
	}

	const boardParams = [owner, boardName, privacy]

	if (isBoardValid(...boardParams)) {
		// RESTRICTED => To a Group
		if (privacy === 'restricted') {
			if (isGroupValid(groupSelected)) {
				groupSelected = JSON.parse(groupSelected);
				if (groupSelected._id) {
					Group.find({owner})
						.then(groups => {
							if (groups && groups.length !== 0 ) {
								group = groups.find((thisGroup) => {
									return thisGroup._id == groupSelected._id;
								})
							}
	
							if (group) {
								newBoard = createBoard(group);
								saveBoard(newBoard);
							} else {
								res.status(403).json({message: 'The selected group is not valid'});
							}
						})
						.catch(e => next(e));
				} else {
					// It is a new group
					const newGroup = createNewGroup(boardSelected);
	
					Group.find({owner})
						.then(groups => {
							let groupFound;
							if (groups && groups.length !== 0) {
								groupFound = groups.find((thisGroup) => {
									return thisGroup.groupName == newGroup.groupName;
								})
							}
	
							if (groupFound) {
								res.status(403).json({message: 'You already have a group with this name'});
							} else {
								newGroup.save()
									.then((newGroup) => {
										newBoard = createBoard(newGroup);
										saveBoard(newBoard);
									})
									.catch(e => next(e));
							}
						})
						.catch(e => next(e));
				}
			}
		} else {
			// NO RESTRICTED => 'Private' or 'Public'
			newBoard = createBoard(group);
			saveBoard(newBoard);
		}
	}
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