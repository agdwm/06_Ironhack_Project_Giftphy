const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const boardSchema = new Schema({
	boardName: { type: String, required: true, index: true },
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	guests: [{ type: Schema.Types.ObjectId, ref: 'Guest' }],
	groups: { type: String, enum: ['family', 'friends', 'work', 'partner'] },
	privacy: {type: String, enum: ['public', 'shared', 'private']}
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});

const Board = mongoose.model('Board', boardSchema);
module.exports = Board;