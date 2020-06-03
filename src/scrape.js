const request = require('request-promise').defaults({ jar: true });
require('dotenv').config();
const puppeteer = require('puppeteer');
const poll = require('promise-poller').default;
const fs = require('fs');
//var userAgent = require('user-agents');

function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time);
	});
}


async function master(first,last,company){
	var read_Data = await read_data();
	var firstRun = await runScrape(first,last,company,read_Data.requestCookies,read_Data.csrf);
	var profile = await fourthRun(firstRun);
	console.log(profile);
	return profile;
}


async function login() {
	const browser = await puppeteer.launch({headless: false,
		args: [
			'--proxy-server=http://170.130.67.216:3128',
		  ]});
	const page = await browser.newPage();
	await page.goto('https://www.linkedin.com/login');
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
		console.log('CAPTCHA DETECTED')
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
		console.log('CAPTCHA FREE')
	}
	
	
	const response2 = await page.goto(process.env.BASE_URL+'/feed/');
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

}

async function read_data() {
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



async function runScrape(first,last,company,requestCookies,csrf){
	var companySearch = encodeURIComponent(company);
	var nameSearch = encodeURIComponent(first+' '+last);
	var optionstest = {
		method: 'GET',
		gzip: true,
		uri: process.env.BASE_URL+'/voyager/api/search/blended?count=10&filters=List()&keywords='+nameSearch+'%20'+companySearch+'&origin=TYPEAHEAD_ESCAPE_HATCH&q=all&queryContext=List(spellCorrectionEnabled-%3Etrue,relatedSearchesEnabled-%3Etrue,kcardTypes-%3EPROFILE%7CCOMPANY%7CJOB_TITLE)&start=0',
		Cookie: requestCookies,
		headers: {
			'Host': 'www.linkedin.com',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0',
			'Accept': 'application/vnd.linkedin.normalized+json+2.1',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			'x-li-lang': 'en_US',
			'x-li-track': '{"clientVersion":"1.6.*","osName":"web","timezoneOffset":-5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2}',
			'x-li-page-instance': 'urn:li:page:d_flagship3_company;XQsNm9LvQB+hGv/2Ud6UfA==',
			'csrf-token': csrf,
			'x-restli-protocol-version': '2.0.0',
			'Connection': 'keep-alive',
			'Referer': 'https://www.linkedin.com/',
			'TE': 'Trailers',
			'Pragma': 'no-cache',
			'Cache-Control': 'no-cache',
			'Cookie': requestCookies
		},
		json: true,
	};
	var usemepls = {};
	await request(optionstest,function(error, response, body){
		//console.log(response);
		for (let i =0; i <body['data'].elements.length; i+=1){
			if(body['data'].elements[i].type==='SEARCH_HITS'){
				
				var urlP = body['data'].elements[i].elements[0].navigationUrl;
				var profId = body['data'].elements[i].elements[0].navigationUrl.split('/')[(urlP.split('/').length)-1];
			}
		}
		//console.log(urlP);
		//console.log(profId);
		var optionsprof = {
			method: 'GET',
			gzip: true,
			uri: process.env.BASE_URL+'/voyager/api/identity/profiles/'+profId+'/profileView',
			Cookie: requestCookies,
			headers: {
				'Host': 'www.linkedin.com',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0',
				'Accept': 'application/vnd.linkedin.normalized+json+2.1',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate, br',
				'x-li-lang': 'en_US',
				'x-li-track': '{"clientVersion":"1.6.*","osName":"web","timezoneOffset":-5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2}',
				'x-li-page-instance': 'urn:li:page:d_flagship3_company;XQsNm9LvQB+hGv/2Ud6UfA==',
				'csrf-token': csrf,
				'x-restli-protocol-version': '2.0.0',
				'Connection': 'keep-alive',
				'Referer': 'https://www.linkedin.com/',
				'TE': 'Trailers',
				'Pragma': 'no-cache',
				'Cache-Control': 'no-cache',
				'Cookie': requestCookies
			},
			json: true,
		};
		usemepls.optionsprof = optionsprof;
	});
	fs.writeFile('./results.txt', JSON.stringify(usemepls.optionsprof), function(err) {
		if (err) {
			console.log(err);
		}
	});
	return usemepls.optionsprof;
}


async function fourthRun(firstRun){
	var usemepls = {};
	await request(firstRun,function(error, response, body){
		var secret=body['included'];
		usemepls.secret = secret;
	});
	
	return usemepls.secret;
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


master('Nick','Lowe','Wells Fargo');
//login();

// module.exports = {
// 	master,
// 	login,
//   };
  

