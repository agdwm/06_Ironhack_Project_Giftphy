const express = require('express');
const router = express.Router();
const { ensureLoggedIn} = require('connect-ensure-login');
const Board = require('../../models/Board');


// (C)RUD -> Create a NEW Board
router.post('/new', ensureLoggedIn(), (req, res, next) => {
	const { boardName, privacy } = req.body;
	let user = req.user._id;

	const newBoard = new Board({ boardName, owner: user, privacy });

	newBoard.save()
		.then((board) => {
			res.status(200).json({board})
		})
		.catch(e => next(e));
})


//C(R)UD -> Retrieve ALL public boards sorted desc
router.get('/', (req, res) => {
	Board.find({privacy:'public'}).sort({updated_at:-1}).populate('owner')
		.then((boards) => {
			//boardName, GIFTS, owner, GUESTS
			console.log('BOARDS', boards);
			res.status(200).json({boards});
		})
		.catch(e => next(e));
})


//C(R)UD -> Retrieve ALL boards of an user (skip && limit)
//Created in the profile route.

//C(R)UD -> Retrieve ALL boards of a group
module.exports = router;