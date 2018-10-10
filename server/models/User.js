const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
	name: { type: String, required: true, index: true, unique: true },
	password: { type: String, required: true },
	email: { type: String, required: true, index: true, unique: true },
	userPic: { type: String, default: 'images/default-avatar.png' },
	role: [{ type: String, enum: ["owner", "guest"] }],
	specialDates: [Date],
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});

const User = mongoose.model('User', userSchema);
module.exports = User;
