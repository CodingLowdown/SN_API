const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProfileDataEntrySchema = new Schema({
	profileID : String,
	fullName : String,
	firstName : String,
	lastName : String,
	profileUrl : String,
	title : String,
	location : String,
	summary : String,
	//contactInfo : String,
	organization : [{
		organizationName: String,
		organizationTitle: String,
		organizationStart: {
			month: Number,
			year: Number,
		},
		organizationEnd: {
			month: Number,
			year: Number,
		},
		organizationDescription: String,
		organizationLocation: String,
		organizationLIURL: String,
		organizationLIID: Number,
	}],
	education : [{
		educationName: String,
		educationId: Number,
		educationDegree: String,
		educationFOS: [String],
		educationEnd: {
			year: Number,
		},
		educationStart: {
			year: Number,
		},
	}],
	followers : Number,
	relationship : Number,
	industry : String,
}, {
	timestamps: true
});


const ProfileDataEntry = mongoose.model('ProfileDataEntry', ProfileDataEntrySchema);

module.exports = ProfileDataEntry;