const express = require('express');
const router = express.Router({ mergeParams: true });
const Scrape = require('../scrapeSN');
const CompanyEntry = require('../models/CompanyEntry');
const checklogs = require('./functions');



router.get('/', async (req,res,next)=>{
	try {
		var text2 = await checklogs.checklogin();
		var compEntries = await CompanyEntry.find({'companyName':req.params.companyName});
		var compEntriesAll = await CompanyEntry.find();
		//res.json(compEntries);
		//console.log(req.params.companyName);
		if (Object.keys(compEntries).length === 0){
			response = await Scrape.companySearch(req.params.companyName,text2);
			if (response.length ===0){
				response = await Scrape.companyBackupSearch(req.params.companyName,text2);
			}
			console.log(response);
			for (let i =0; i< response.length; i+=1){
				const companyEntry = new CompanyEntry(response[i]);
				const createdEntry = await companyEntry.save();
				console.log(createdEntry);
			}
			compEntries = await CompanyEntry.find();
			res.json(compEntries);
		} else{res.json(compEntries);}
        
	} catch (error) {
		next(error);
	}
});

module.exports = router;