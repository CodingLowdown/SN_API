const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProfileidEntrySchema = new Schema({
	profileName: String,
	companyName: String,
	profileID: String,
	profilesearchTYPE: String,
	profileAUTHTOKEN: String,
	SearchAlias: [String],
}, {
	timestamps: true
});

const ProfileidEntry = mongoose.model('ProfileidEntry', ProfileidEntrySchema);

module.exports = ProfileidEntry;