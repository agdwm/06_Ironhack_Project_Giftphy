const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const giftSchema = new Schema({
	giftName: { type: String, required: true, index: true },
	giftPic: String,
	url: String,
	location: {
		type: { type: String }, 
		coordinates: [Number]
	},
	description: String,
	priority: { type: Number, enum:[1, 2, 3, 4, 5] },
	status: { type: String, enum: ['checked', 'unchecked']},
	board: { type: Schema.Types.ObjectId, ref: 'Board', index: true },
});	

const Gift = mongoose.model('Gift', giftSchema);
module.exports = Gift;