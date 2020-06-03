const mongoose = require('mongoose');
const { Schema } = mongoose;

const CookiesEntrySchema = new Schema({
	requestCookies: String,
	username: String,
	csrf: String,
},{
	timestamps: true
});


const CookiesEntry = mongoose.model('CookiesEntry', CookiesEntrySchema);

module.exports = CookiesEntry;
    

