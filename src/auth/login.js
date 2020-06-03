const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UserEntry = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const schema = Joi.object().keys({
	username: Joi.string().email().required(),
	password: Joi.string().min(6).required()
});


function createTokenSendResponse(user,res,next) {
	const payload = {
		_id: user._id,
		username: user.username,
		role: user.role,
		active: user.active
	};
	jwt.sign(payload,process.env.TOKEN_SECRET,
		{expiresIn: '4h'}, (err,token)=> {
			if (err){
				respondError422(res,next);
			} else {
				res.json({
					token: token});
			}
		});
}


	

router.get('/', (req,res)=> {
	res.json({
		message: 'Hello World'
	});
});


function respondError422(res,next) {
	res.status(422);
	const error = new Error('Unable to login');
	next(error);
}

router.post('/', async (req,res,next) => {
	try {
		await Joi.validate(req.body, schema);
		const currentuser = await UserEntry.findOne({'username':req.body.username});
		if (Object.keys(currentuser).length === 0) {
			respondError422(res,next);
		}
		else {
			//console.log(currentuser.password)
			//console.log(req.body.password)
			const dbresult= await bcrypt.compare(req.body.password, currentuser.password);
			if (dbresult){
				//res.json(dbresult);
				createTokenSendResponse(currentuser,res,next);
			} else {
				respondError422(res,next);
			}
			
		}

	} catch(err) {
		respondError422(res,next);
	}
});

module.exports = router;