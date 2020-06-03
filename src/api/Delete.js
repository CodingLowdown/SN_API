const express = require('express');
const router = express.Router({ mergeParams: true });
const CompanyEntry = require('../models/CompanyEntry');
const ProfileidEntry = require('../models/ProfileidEntry');
const ProfileEntry = require('../models/ProfileIDDataEntry');
const CookiesEntry = require('../models/CookiesEntry');

router.get('/', async (req,res,next)=>{
	if (req.params.search === 'peopleSearch'){
		try {
			var findpepEntries = await ProfileidEntry.find({'companyName':req.params.companyName, 'profileName':req.params.first+req.params.last});
			var compEntries = await ProfileidEntry.deleteMany({'companyName':req.params.companyName, 'profileName':req.params.first+req.params.last});
			compEntries = await ProfileEntry.deleteMany({'profileID':findpepEntries[0].profileID});
			res.json(compEntries);
		} catch(err) {
			res.json({
				message: 'Nothing to delete'
			});
		}
	}
        
	else if (req.params.search === 'companySearch') {
		compEntries = await CompanyEntry.deleteMany({'companyName':req.params.companyName});
		res.json(compEntries);
	}
	else if (req.params.search === 'cookies') {
		compEntries = await CookiesEntry.deleteMany();
		res.json(compEntries);
	}
	else {
		res.json({
			message: 'Nothing to delete'
		});
	}
});

module.exports = router;