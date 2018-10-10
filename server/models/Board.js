const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const boardSchema = new Schema({
	boardName: { type: String, required: true, index: true },
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 	group: { type: Schema.Types.ObjectId, ref: 'Group' },
	privacy: { type: String, enum: ['public', 'shared', 'private'] }
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});

const Board = mongoose.model('Board', boardSchema);
module.exports = Board;