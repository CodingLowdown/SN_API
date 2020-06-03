const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserEntrySchema = new Schema({
	username: String,
	password: String,
	active: Boolean,
	role: String,
}, {
	timestamps: true
},
{ strict: false });

const UserEntry = mongoose.model('UserEntry', UserEntrySchema);

module.exports = UserEntry;