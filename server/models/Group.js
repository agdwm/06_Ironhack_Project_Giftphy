const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const groupSchema = new Schema({
	groupName: { type: String, required: true, index: true, lowercase: true, trim: true, maxlength: 50 },
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;