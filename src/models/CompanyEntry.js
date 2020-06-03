const mongoose = require('mongoose');
const { Schema } = mongoose;

const CompanyEntrySchema = new Schema({
	companyName: String,
	companyNumber: Number,
	companyAlias: String,
},{
	timestamps: true
});


const CompanyEntry = mongoose.model('CompanyEntry', CompanyEntrySchema);

module.exports = CompanyEntry;
    

