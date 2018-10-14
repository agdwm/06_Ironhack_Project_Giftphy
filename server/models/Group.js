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

// [ { 
// 	users: [],
//     _id: 5bc31cd53727a3211d6fa0a7,
//     groupName: 'friends',
//     owner: 5bc212421e8f4e217193e46a,
//     created_at: 2018-10-14T10:39:17.182Z,
//     updated_at: 2018-10-14T10:39:17.182Z,
//     __v: 0 },
//   { 
// 	users: [ [Object], [Object] ],
//     _id: 5bc321488c1776262181f1c8,
//     groupName: 'family',
//     owner: 5bc212421e8f4e217193e46a,
//     created_at: 2018-10-14T10:58:16.364Z,
//     updated_at: 2018-10-14T10:58:16.364Z,
// 	__v: 0 
// } ]

// TOTAL USERS:
// [ 
//	{ _id: 5bbf617ae4fd3169704ef92f,
//     username: 'sara',
//     email: 'sara@gmail.com' },
//  { _id: 5bc0b184e5c7836632a0aa38,
//     username: 'almu',
//     email: 'almu@gmail.com' } 
// ]

// SELECTED:
// [ 
// 	 { _id: 5bbf617ae4fd3169704ef92f,
//     	username: 'sara',
//     	email: 'sara@gmail.com' },
//   { _id: 5bc0b184e5c7836632a0aa38,
//     	username: 'almu',
// 		email: 'almu@gmail.com' } 
// ]