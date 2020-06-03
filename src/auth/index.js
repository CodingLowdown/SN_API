const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UserEntry = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const schema = Joi.object().keys({
	username: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	role: Joi.string().valid('user','admin','mod'),
	active: Joi.bool()
});


function createTokenSendResponse(user,res,next) {
	const payload = {
		_id: user._id,
		username: user.username,
		role: user.role,
		active: user.active
	};
	jwt.sign(payload,process.env.TOKEN_SECRET,
		{expiresIn: '1d'}, (err,token)=> {
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

router.post('/', async (req,res,next) => {
	try {
		await Joi.validate(req.body, schema);
		//res.json(result)
		const currentuser = await UserEntry.find({'username':req.body.username});
		if (Object.keys(currentuser).length === 0) {
			const hashedpassword = await bcrypt.hash(req.body.password,12);
			const userEntry = new UserEntry({username: req.body.username, password: hashedpassword});
			const createdEntry = await userEntry.save();
			createTokenSendResponse(currentuser,res,next);
		} else {
			res.json({
				message: 'Email already signed up'
			});
		}
	} catch(err) {
		res.status(422);
		next(err);
	}
	// if (result.error === null) {
	// 	console.log('here');
	// const currentuser = await UserEntry.find({'username':req.body.username});
	// if (Object.keys(currentuser).length === 0) {
	// 	const userEntry = new UserEntry({username: req.body.username, password: req.body.password});
	// 	const createdEntry = await userEntry.save();
	// 	res.json(createdEntry);
	// } else {
	// 	res.json({
	// 		message: 'Email already signed up'
	// 	});
	// 	}
	// } else {
	// 	next(result.error);
	// }
    
    
});

function respondError422(res,next) {
	res.status(422);
	const error = new Error('Unable to login');
	next(error);
}


module.exports = router;