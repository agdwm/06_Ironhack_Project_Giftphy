const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const giftSchema = new Schema({
	giftName: { type: String, required: true, index: true, trim: true },
	giftPic: { type: String, default: 'images/default-gift-500.png' },
	giftUrl: String,
	location: { 
		type: { type: String }, 
		coordinates: [Number]
	},
	description:  { type: String, maxlength: 400 }, 
	priority: { type: Number, enum:[1, 2, 3, 4, 5], trim: true },
	status: { type: String, enum: ['checked', 'unchecked'], default:'unchecked' },
	board: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
});	

const Gift = mongoose.model('Gift', giftSchema);
module.exports = Gift;