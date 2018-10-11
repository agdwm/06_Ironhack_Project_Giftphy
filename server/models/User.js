const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
	username: { 
		type: String,
		required: true, 
		index: true, 
		unique: true, 
		trim: true
	},
	password: { 
		type: String, 
		required: true,
		trim: true
	},
	email: { 
		type: String, 
		required: true, 
		index: true, 
		unique: true, 
		trim: true, 
		lowercase: true
	},
	profilePic: { 
		type: String, 
		default: 'images/default-avatar-500.png' },
	role: [{ 
		type: String, 
		enum: ["owner", "guest"] 
	}],
	specialDates: [{ 
		type: Date, 
		default: Date.now
	}],
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});


const User = mongoose.model('User', userSchema);
module.exports = User;
