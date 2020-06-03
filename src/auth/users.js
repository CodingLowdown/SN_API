const express = require('express');
const router = express.Router();
const UserEntry = require('../models/Users');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

const schema = Joi.object().keys({
	username: Joi.string().email(),
	password: Joi.string().min(6),
	role: Joi.string().valid('user','admin','mod'),
	active: Joi.bool()
});

router.get('/', async (req,res,next)=>{
	try {
		const result = await UserEntry.find({},'-password');
		res.json(result); 
	} catch(err) {
		next(err);
	}
});

router.patch('/:id', async(req,res,next) => {
	const { id: _id} = req.params;

	try {
		const result = schema.validate(req.body);
		if(!result.error) {
			const query = {_id};
			const updatedUser = req.body;
			if (updatedUser.password) {
				updatedUser.password = await bcrypt.hash(updatedUser.password, 12);
			}
			const alteredEntry = await UserEntry.updateOne(query,{$set: updatedUser},{ //options
				returnNewDocument: true,
				new: true,
				strict: false
			});
			res.json(await UserEntry.find(query, '-password'));
			//res.json(alteredEntry);
		} else {
			res.status(422);
			throw new Error(result.error);
		}
		
		
	} catch (err) {
		next(err);
	}

});

module.exports = router;