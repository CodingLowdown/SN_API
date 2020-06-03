const express = require('express');
const router = express.Router({ mergeParams: true });
const Scrape = require('../scrapeSN');
const CompanyEntry = require('../models/CompanyEntry');
const ProfileidEntry = require('../models/ProfileidEntry');
const ProfileEntry = require('../models/ProfileIDDataEntry');
const checklogs = require('./functions');

const opts = { new: true };

function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time);
	});
}

async function runCompanySearch(compName,text2) {
	var compEntries = await CompanyEntry.find({'companyAlias':compName});
	if (Object.keys(compEntries).length === 0) {
		var response = await Scrape.companySearch(compName,text2);
		if (response.length ===0){
			response = await Scrape.companyBackupSearch(compName,text2);
		}
		//console.log(response);
		for (let i =0; i< response.length; i+=1){
			response[i].companyAlias = compName;
			const companyEntry = new CompanyEntry(response[i]);
			const createdEntry = await companyEntry.save();
			console.log(createdEntry);
		}
		compEntries = await CompanyEntry.find({'companyAlias':compName});
	}
	return compEntries;
}

async function runProfileSearch(firstName,lastName,compName,text2){
	var peopleEntries = await ProfileidEntry.find({'companyName':compName, 'SearchAlias':firstName+lastName});
	if (Object.keys(peopleEntries).length === 0){
		var compEntries = await runCompanySearch(compName,text2);
		var responses = await Scrape.profileSearch(firstName,lastName,{companyName: compEntries[0].companyName, companyNumber: compEntries[0].companyNumber},'','',text2);
		var response = responses.profileSearches;
		var Counts = responses.total_count;
		for (let i =0; i< response.length; i+=1){
			response[i].SearchAlias=firstName+lastName;
			let filter = {profileID: response[i].profileID};
			const profileidEntry = new ProfileidEntry(response[i]);
			console.log(response[i].SearchAlias);
			
			let doc = await ProfileidEntry.findOneAndUpdate(filter, { $push: { SearchAlias: response[i].SearchAlias  } }, opts);
			console.log(doc);
			if (doc == null) {
				const profileidEntry = new ProfileidEntry(response[i]);
				const createdEntry = await profileidEntry.save();
				console.log(createdEntry);
			}
			
		}
		for (let j=1; j<Counts; j+=1){
			var startnum=j*25;
			response = await Scrape.profileSearchLatter(firstName,lastName,{companyName: compEntries[0].companyName, companyNumber: compEntries[0].companyNumber},'','',text2,startnum);
			for (let i =0; i< response.length; i+=1){
				response[i].SearchAlias=firstName+lastName;
				let filter = {profileID: response[i].profileID};
				const profileidEntry = new ProfileidEntry(response[i]);
				console.log(response[i].SearchAlias);
				
				let doc = await ProfileidEntry.findOneAndUpdate(filter, { $push: { SearchAlias: response[i].SearchAlias  } }, opts);
				console.log(doc);
				if (doc == null) {
					const profileidEntry = new ProfileidEntry(response[i]);
					const createdEntry = await profileidEntry.save();
					console.log(createdEntry);
				}
				
			}
		}
	}
}


async function runProfileSearchDetail(SCOPE,compName,text2,str,min,max) {
	var compEntries = await  runCompanySearch(compName,text2);
	console.log(compEntries);
	var responses = await Scrape.profileSearch('','',{companyName: compEntries[0].companyName, companyNumber: compEntries[0].companyNumber},SCOPE,str,text2);
	var response = responses.profileSearches;
	var Counts = responses.total_count;
	for (j=1; j<Counts; j+=1){
		var startnum=j*25;
		responses = await Scrape.profileSearchLatter('','',{companyName: compEntries[0].companyName, companyNumber: compEntries[0].companyNumber},SCOPE,str,text2,startnum);
		//Array.prototype.push.apply(response,responses);
		response = response.concat(responses);
	}
	var appendedcreatedEntry=[];

	for (let i =0; i <response.length; i +=1) {

		var peopleEntries = await ProfileidEntry.find({'profileID': response[i].profileID});
		if (Object.keys(peopleEntries).length === 0){
			//response[i].SearchAlias='';
			const profileidEntry = new ProfileidEntry(response[i]);
			var createdEntry = await profileidEntry.save();
			console.log(createdEntry);
			var ProfilesEntries = await ProfileEntry.find({'profileID': createdEntry.profileID});
			if (Object.keys(ProfilesEntries).length === 0) {
				var rand = ((Math.random()) * (max - min)) + min; //Generate Random number between 5 - 10
				await delay(rand* 1000);
				console.log(rand);
				//alert('Wait for ' + rand + ' seconds');
				var outputresponse = await Scrape.profileData({profileID: createdEntry.profileID, profilesearchTYPE: createdEntry.profilesearchTYPE, profileAUTHTOKEN: createdEntry.profileAUTHTOKEN},text2);
				const profileEntry = new ProfileEntry(outputresponse);
				createdEntry = await profileEntry.save();
				appendedcreatedEntry.push(createdEntry);
				console.log(appendedcreatedEntry);
			} else {
				console.log('In db');
				//ProfilesEntries = await ProfileEntry.find({'profileID': createdEntry.profileID});
				appendedcreatedEntry.push(ProfilesEntries);
			}

		} else {
			console.log('In db');
			peopleEntries = await ProfileidEntry.find({'companyName':response[i].companyName, 'profileName':response[i].profileName});
			//console.log(peopleEntries);
			ProfilesEntries = await ProfileEntry.find({'profileID': peopleEntries[0].profileID});
			appendedcreatedEntry.push(ProfilesEntries);
		}

	}
	return appendedcreatedEntry;
	
}


router.get('/people/:first/:last/', async (req,res,next)=>{
	try {
		var text2 = await checklogs.checklogin();
		var compName = req.query.companyName;
		var firstName = req.params.first;
		var lastName = req.params.last;
		await runProfileSearch(firstName,lastName,compName,text2);
		peopleEntries = await ProfileidEntry.find({'companyName':compName, 'SearchAlias':req.params.first+req.params.last});
		var appendedPeopleEntries = [];
		for (let i=0; i < peopleEntries.length; i+=1){
			var ProfilesEntries = await ProfileEntry.find({'profileID': peopleEntries[i].profileID});
			
			if (Object.keys(ProfilesEntries).length === 0) {
				var response = await Scrape.profileData({profileID: peopleEntries[i].profileID, profilesearchTYPE: peopleEntries[i].profilesearchTYPE, profileAUTHTOKEN: peopleEntries[i].profileAUTHTOKEN},text2);
				const profileEntry = new ProfileEntry(response);
				const createdEntry = await profileEntry.save();
				console.log(createdEntry);
				//ProfilesEntries = await ProfileEntry.find({'profileID': peopleEntries.profileID});
				appendedPeopleEntries.push(createdEntry);
			} else {
				appendedPeopleEntries.push(ProfilesEntries);
			}
		}
		res.json(appendedPeopleEntries);
		

		
		
	} catch(error) {
		next(error);
	}
});

router.get('/company/:companyName/:SCOPE/',async (req,res,next) => {
	try {
		//let limit = req.query.limit;
		var text2 = await checklogs.checklogin();
		if (req.query.seniority== null) {
			str='';
		} else {
			let seniority = req.query.seniority.split(',');
			var seniorityId=[];
			if (seniority.length>0){
				var ScrapeOut= await Scrape.filterSearch('SENIORITY','',text2);
				for (let ij=0; ij<ScrapeOut.length; ij+=1){
					for (let ijk=0; ijk<seniority.length; ijk+=1) {
						if(ScrapeOut[ij].displayValue ===seniority[ijk]) {
							seniorityId.push(ScrapeOut[ij].id);
						}
					}
				
				}
				console.log(seniorityId);
				for (let ijkl=0; ijkl<seniorityId.length; ijkl+=1) {
					if (ijkl===0) {
						var strs = `(id:${seniorityId[ijkl]})`;
					} else {
						strs += `,(id:${seniorityId[ijkl]})`;
					}
				
				}
			
				var str = `,seniorityLevelV2:(includedValues:List(${strs}))`;
			}
		}
		if (req.query.mintime== null) {
			var min =0;
		} else {
			min = parseFloat(req.query.mintime);
		}
		if (req.query.maxtime== null) {
			var max =1;
		} else {
			max = parseFloat(req.query.maxtime);
		}
		
		var compName = req.params.companyName;
		var appendedcreatedEntry = await runProfileSearchDetail(req.params.SCOPE,compName,text2,str,min,max);
		res.json(appendedcreatedEntry);

	} catch (error) {
		next(error);
	}
});

router.get('/test', async (req,res,next) => {
	var text2 = await checklogs.checklogin();
	var filtertype = 'SENIORITY';
	//var keyword = '&query=United States';
	var keyword = '';
	var ScrapeOut= await Scrape.filterSearch(filtertype,keyword,text2);
	res.json(ScrapeOut);

});




module.exports = router;