const request = require('request-promise').defaults({ jar: true });
require('dotenv').config();
const puppeteer = require('puppeteer');
const poll = require('promise-poller').default;
const fs = require('fs');
//var userAgent = require('user-agents');


var optionstest = {
	method: 'GET',
	gzip: true,
	uri: process.env.SALES_BASE_URL+process.env.SALES_API_SEARCH_TYPE,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0',
		'Accept': '*/*',
		'Accept-Language': 'en-US,en;q=0.5',
		'Accept-Encoding': 'gzip, deflate, br',
		'x-li-lang': 'en_US',
		'x-restli-protocol-version': '2.0.0',
		'Connection': 'keep-alive',
		'Referer': 'https://www.linkedin.com/sales/homepage',
		'TE': 'Trailers',
		'Pragma': 'no-cache',
		'Cache-Control': 'no-cache',
	},
	json: true,
};

async function filterSearch(filtertype,keyword,read_Data){
	optionstest['headers']['Cookie']= read_Data.requestCookies;
	optionstest['Cookie']= read_Data.requestCookies;
	optionstest['headers']['csrf-token']= read_Data.csrf;
	optionstest['uri']= process.env.SALES_BASE_URL+process.env.FILTER_QUERY.replace('SENIORITY',filtertype)+keyword;
	var response = await request(optionstest);
	return response.elements;
}


async function companySearch(company,read_Data){
	var companySearch = encodeURIComponent(company);
	//console.log(companySearch)
	//var nameSearch = encodeURIComponent(first+' '+last);
	optionstest['headers']['Cookie']= read_Data.requestCookies;
	optionstest['Cookie']= read_Data.requestCookies;
	optionstest['headers']['csrf-token']= read_Data.csrf;
	optionstest['uri']= process.env.SALES_BASE_URL+process.env.SALES_API_SEARCH_TYPE.replace('COMPANYNAME',companySearch);
	var response = await request(optionstest);
	var CompaniesSearch = [];
	for (let i=0; i<response.elements.length; i+=1){
		if (response.elements[i].displayValue.toLowerCase().trim() === company.toLowerCase().trim() ) {
			CompaniesSearch.push({
				companyName : response.elements[i].displayValue,
				companyNumber : response.elements[i].id,
			});
		}
	}
	return CompaniesSearch;
}

async function companyBackupSearch(company,read_Data){
	var companySearch = encodeURIComponent(company);
	optionstest['headers']['Cookie']= read_Data.requestCookies;
	optionstest['Cookie']= read_Data.requestCookies;
	optionstest['headers']['csrf-token']= read_Data.csrf;
	optionstest['uri']= process.env.SALES_BASE_URL+process.env.SALES_API_COMPANY_BACKUP.replace('COMPANYNAME',companySearch);
	var response = await request(optionstest);
	var CompaniesSearch = [];
	for (let i=0; i<response.elements.length; i+=1){
		if (response.elements[i].companyName.toLowerCase().trim().includes(company.toLowerCase().trim())) {
			CompaniesSearch.push({
				companyName : response.elements[i].companyName,
				companyNumber : response.elements[i].entityUrn.split(':')[3],
			});
		}
	}

	return CompaniesSearch;
}

async function profileSearch(first,last,companyObj,SCOPE,TYPESEARCH,read_Data){
	var company = companyObj.companyName;
	var companyNum = companyObj.companyNumber;
	var companySearch = encodeURIComponent(company);
	var nameSearch = encodeURIComponent(first+' '+last);
	var scope = '';
	if (SCOPE===''){
		scope = 'CURRENT';
	} else {
		scope = SCOPE;
	}
	var typeSearch ='';
	if (TYPESEARCH===''){
		typeSearch = '';
	} else {
		typeSearch = TYPESEARCH;
	}
	optionstest['headers']['Cookie']= read_Data.requestCookies;
	optionstest['Cookie']= read_Data.requestCookies;
	optionstest['headers']['csrf-token']= read_Data.csrf;
	optionstest['uri']= process.env.SALES_BASE_URL+process.env.SALES_API_SEARCH.replace('SCOPE',scope).replace('TYPESEARCH',typeSearch).replace('KEYWORD',nameSearch).replace('COMPANYNAME',companySearch).replace('COMPANYID',companyNum);
	//console.log(optionstest['uri'])
	var response = await request(optionstest);
	var totalCount=response.paging.total;
	var countOut = Math.ceil(totalCount /25);
	var profileSearches =[];
	for (let i = 0; i < response.elements.length; i+=1){
		//console.log(response.elements[i])
		//console.log(response.elements[i].entityUrn.toString().split(':', 4)[3].split('(',2)[1].split(',',2)[0])
		profileSearches.push({
			profileName: response.elements[i].firstName+response.elements[i].lastName,
			companyName: companyObj.companyName,
			profileID: response.elements[i].entityUrn.split(':', 4)[3].split('(',2)[1].split(',',2)[0],
			profilesearchTYPE: response.elements[i].entityUrn.split(':', 4)[3].split('(',2)[1].split(',',3)[1],
			profileAUTHTOKEN: response.elements[i].entityUrn.split(':', 4)[3].split('(',2)[1].split(',',4)[2].split(')',2)[0],
		});
	}
	return {profileSearches: profileSearches, total_count: countOut};
}

async function profileSearchLatter(first,last,companyObj,SCOPE,TYPESEARCH,read_Data,startnum){
	var company = companyObj.companyName;
	var companyNum = companyObj.companyNumber;
	var companySearch = encodeURIComponent(company);
	var nameSearch = encodeURIComponent(first+' '+last);
	var scope = '';
	if (SCOPE===''){
		scope = 'CURRENT';
	} else {
		scope = SCOPE;
	}
	var typeSearch ='';
	if (TYPESEARCH===''){
		typeSearch = '';
	} else {
		typeSearch = TYPESEARCH;
	}
	optionstest['headers']['Cookie']= read_Data.requestCookies;
	optionstest['Cookie']= read_Data.requestCookies;
	optionstest['headers']['csrf-token']= read_Data.csrf;
	optionstest['uri']= process.env.SALES_BASE_URL+process.env.SALES_API_SEARCH.replace('start=0','start='+startnum).replace('SCOPE',scope).replace('TYPESEARCH',typeSearch).replace('KEYWORD',nameSearch).replace('COMPANYNAME',companySearch).replace('COMPANYID',companyNum);
	//console.log(optionstest);
	var response = await request(optionstest);
	var profileSearches =[];
	for (let i = 0; i < response.elements.length; i+=1){
		//console.log(response.elements[i])
		//console.log(response.elements[i].entityUrn.toString().split(':', 4)[3].split('(',2)[1].split(',',2)[0])
		profileSearches.push({
			profileName: response.elements[i].firstName+response.elements[i].lastName,
			companyName: companyObj.companyName,
			profileID: response.elements[i].entityUrn.split(':', 4)[3].split('(',2)[1].split(',',2)[0],
			profilesearchTYPE: response.elements[i].entityUrn.split(':', 4)[3].split('(',2)[1].split(',',3)[1],
			profileAUTHTOKEN: response.elements[i].entityUrn.split(':', 4)[3].split('(',2)[1].split(',',4)[2].split(')',2)[0],
		});
	}
	return profileSearches;
}


async function profileData(ProfileObj,read_Data){
	optionstest['headers']['Cookie']= await read_Data.requestCookies;
	optionstest['Cookie']= await read_Data.requestCookies;
	optionstest['headers']['csrf-token']= await read_Data.csrf;
	optionstest['uri']= await process.env.SALES_BASE_URL+process.env.SALES_API_PROFILE.replace('PROFILEID',ProfileObj.profileID).replace('PROFILEAUTHTYPE',ProfileObj.profilesearchTYPE).replace('PROFILEAUTHTOKEN',ProfileObj.profileAUTHTOKEN);
	//console.log(optionstest)
	var response = await request(optionstest);
	//console.log(response.contactInfo);
    
	var profileID=ProfileObj.profileID;
	var fullName=response.fullName;
	var firstName=response.fullName;
	var lastName=response.lastName;
	var profileUrl=response.flagshipProfileUrl;
	var title=response.defaultPosition.title;
	var location=response.location;
	var summary=response.summary;
	//var contactInfo = response.contactInfo;
	var organization=[];
	// var organizationTitle=[];
	// var organizationStart=[];
	// var organizationEnd=[];
	// var organizationDescription=[];
	// var organizationLocation=[];
	// var organizationLIURL=[];
	// var organizationLIID=[];
	var education=[];
	// var educationId=[];
	// var educationDegree=[];
	// var educationFOS=[];
	// var educationEnd=[];
	// var educationStart=[];
	var followers=response.numOfConnections;
	var relationship=response.numOfSharedConnections;
	var industry=response.industry;
	for (let i = 0; i< response.positions.length; i+=1){
		try {
			var orgLIURL = process.env.BASE_URL+'/company/'+response.positions[i].companyUrn.split(':')[3];
			var orgLIID = response.positions[i].companyUrn.split(':')[3];
		} catch (err) {
			orgLIURL = '';
			orgLIID='';
		}
		organization.push({
			'organizationName': response.positions[i].companyName,
			'organizationTitle': response.positions[i].title,
			'organizationStart': response.positions[i].startedOn,
			'organizationEnd': response.positions[i].endedOn,
			'organizationDescription': response.positions[i].description,
			'organizationLocation': response.positions[i].location,
			'organizationLIURL': orgLIURL,
			'organizationLIID': orgLIID,
		});
       
	}
	for (let i = 0; i< response.educations.length; i+=1){
		try {
			var edId = response.educations[i].school.split(':')[3];
		} catch(err) {
			edId='';
		}
		education.push({
			'educationName': response.educations[i].schoolName,
			'educationId': edId,
			'educationDegree': response.educations[i].degree,
			'educationFOS': response.educations[i].fieldsOfStudy,
			'educationEnd': response.educations[i].endedOn,
			'educationStart': response.educations[i].startedOn,
            
		});
	}

	var profileObject = ({
		'profileID' : profileID,
		'fullName' : fullName,
		'firstName' : firstName,
		'lastName' : lastName,
		'profileUrl' : profileUrl,
		'title' : title,
		'location' : location,
		'summary' : summary,
		//'contactInfo': contactInfo,
		'organization' : organization,
		// 'organizationTitle' : [organizationTitle],
		// 'organizationStart' : [organizationStart],
		// 'organizationEnd' : [organizationEnd],
		// 'organizationDescription' : [organizationDescription],
		// 'organizationLocation' : [organizationLocation],
		// 'organizationLIURL' : [organizationLIURL],
		// 'organizationLIID' : [organizationLIID],
		'education' : education,
		// 'educationId' : [educationId],
		// 'educationDegree' : [educationDegree],
		// 'educationFOS' : [educationFOS],
		// 'educationEnd' : [educationEnd],
		// 'educationStart' : [educationStart],
		'followers' : followers,
		'relationship' : relationship,
		'industry' : industry,
	});
	//console.log(profileObject.education[0].educationStart)
	//console.log(profileObject.education)
	//console.log(profileObject)
	return profileObject;
}

function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time);
	});
}

async function login() {
	const browser = await puppeteer.launch( // {  headless: false,}
	);
	const page = await browser.newPage();
	await page.goto('https://www.linkedin.com/sales');
	await page.type('#username', process.env.USERNAME);
	await page.type('#password', process.env.PASSWORD);

	await Promise.all([
		page.click('.btn__primary--large'),
		//page.waitForSelector('#captcha-internal', { visible: true, timeout: 0 }),
		page.waitForNavigation({waitUntil: 'networkidle0'})
	]);

	
	delay(3000);
	var checkurl= await page.url();
	if(checkurl.includes('checkpoint/challenge')) {
		console.log('CAPTCHA DETECTED');
		const siteDetails = {
			sitekey: '6Lc7CQMTAAAAAIL84V_tPRYEWZtljsJQJZ5jSijw',
			pageurl: checkurl
		};
		console.log(siteDetails);
		const requestId = await initiateCaptchaRequest(process.env.API_KEY,siteDetails);
		console.log(requestId);
		const response = await pollForRequestResults(process.env.API_KEY, requestId);
		console.log(response);
		await page.waitForSelector('iframe');
		const elementHandle = await page.$(
			'iframe[id="captcha-internal"]',
		);
		await elementHandle.contentFrame();
		await page.evaluate(`document.getElementById('captcha-internal').contentWindow.document.getElementById('g-recaptcha-response').value="${response}";`);
		await page.evaluate('document.getElementById(\'captcha-internal\').contentWindow.document.getElementById("g-recaptcha-response").style.display = "";');
		await page.evaluate('document.getElementById(\'captcha-internal\').contentWindow.___grecaptcha_cfg.clients[0].D.D.callback()');
		//.then(console.log('NO CAPTCHA'),)
		//.catch(console.log('CAPTCHA DETECTED'),)
	} else {
		console.log('CAPTCHA FREE');
	}
	
	
	const response2 = await page.goto(process.env.BASE_URL+'/sales/homepage/');
	delay(6000);
	var headers = response2.headers();
	var cookies = await page.cookies();

	fs.writeFile('./headers.txt', JSON.stringify(headers), function(err) {
		if (err) {
			console.log(err);
		}
	});
	fs.writeFile('./cookies.txt', JSON.stringify(cookies), function(err) {
		if (err) {
			console.log(err);
		}
	});
	await browser.close();
	return { requestCookies: JSON.stringify(cookies)};

}

async function read_data_txt() {
	var fs = require('fs');
	//var text = JSON.parse(fs.readFileSync('./headers.txt').toString('utf-8'));
	var text2 = JSON.parse(fs.readFileSync('./cookies.txt').toString('utf-8'));
	
	//var textByLine = text.split("\n")
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


async function initiateCaptchaRequest(apiKey,siteDetails) {
	const formData = {
	  method: 'userrecaptcha',
	  googlekey: siteDetails.sitekey,
	  key: apiKey,
	  pageurl: siteDetails.pageurl,
	  json: 1
	};
	const response = await request.post('http://2captcha.com/in.php', {form: formData});
	return JSON.parse(response).request;
}
  
async function pollForRequestResults(key, id, retries = 75, interval = 1500, delay = 30000) {
	await timeout(delay);
	return poll({
	  taskFn: requestCaptchaResults(key, id),
	  interval,
	  retries
	});
}
  
function requestCaptchaResults(apiKey, requestId) {
	const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
	return async function() {
	  return new Promise(async function(resolve, reject){
			const rawResponse = await request.get(url);
			const resp = JSON.parse(rawResponse);
			if (resp.status === 0) return reject(resp.request);
			resolve(resp.request);
	  });
	};
}
  
const timeout = millis => new Promise(resolve => setTimeout(resolve, millis));


//master('Nick','Lowe','Wells Fargo');
//login();

module.exports = {
	companySearch,
	companyBackupSearch,
	profileSearch,
	profileSearchLatter,
	profileData,
	login,
	filterSearch,
};
  

//companySearch('Wells Fargo')
//companyBackupSearch('Wells Fargo');
//profileSearch('Nick','Lowe',{ companyName: 'Wells Fargo', companyNumber: '1235' },'','');
//profileData({profileID: 'ACwAABj6ys4BSPvUaRbtlCKUkK6-pBHmiB1b9ms',profilesearchTYPE: 'NAME_SEARCH',profileAUTHTOKEN: 'Y3lG'});
