const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const requestSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	guest: { type: Schema.Types.ObjectId, ref: 'User' },
	group: { type: Schema.Types.ObjectId, ref: 'Group' },
	status: { type: String, enum: ['pending', 'accepted', 'rejected'] }
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});

const Request = mongoose.model('Request', requestSchema);
module.exports = User;