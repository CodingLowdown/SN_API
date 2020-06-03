const Scrape = require('../scrapeSN');
const CookiesEntry = require('../models/CookiesEntry');

async function read_data(text2) {
	var csrf=  '';
	for (let i =0; i < text2.length; i+=1){
		if (text2[i].name==='JSESSIONID') {
			csrf = text2[i].value;
		}
	
	}
	csrf = csrf.replace(/["']/g, '');
	var str=[];
	for (let i =0; i < text2.length; i+=1){
		str.push(text2[i].name+'='+text2[i].value);
	}
	
	const requestCookies=str.join('; ');
	return {requestCookies: requestCookies, csrf: csrf};
}

async function checklogin() {
	const cookiesRes = await CookiesEntry.findOne();
	
	if (cookiesRes == null) {
		console.log('No Data Running new Code');
		const cookiesOut = await Scrape.login();
		var cookiesIndb = await {requestCookies: cookiesOut.requestCookies};
		const cookieEntry = new CookiesEntry(cookiesIndb);
		const createdEntry = await cookieEntry.save();
		console.log(createdEntry);
	} else {

		var lastUpdated=new Date(Date.parse(cookiesRes.createdAt));
		lastUpdated.setHours(lastUpdated.getHours()+4);
		//console.log(new Date())
		//console.log(lastUpdated )
		if (new Date() > lastUpdated ) {
			console.log('Refreshing Cookies');
			var CookiesDelete = await CookiesEntry.deleteMany();
			//console.log(json(CookiesEntry.find()))
			const cookiesOut = await Scrape.login();
			cookiesIndb = await {requestCookies: cookiesOut.requestCookies};
			const cookieEntry = new CookiesEntry(cookiesIndb);
			//console.log(cookieEntry)
			const createdEntry = await cookieEntry.save();
			console.log(createdEntry);
		} else {
			console.log('Cookies good to go');
		}
	}
	var outputCookiesdb = await CookiesEntry.findOne();
	cookiesIndb = await read_data(JSON.parse(outputCookiesdb.requestCookies));
	var outputCookies = await {requestCookies: cookiesIndb.requestCookies, csrf: cookiesIndb.csrf};
	//console.log(outputCookies);
	return outputCookies;
}

module.exports = {
	read_data,checklogin
};