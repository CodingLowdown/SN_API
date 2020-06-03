const mongoose = require('mongoose');
const UserEntry = require('../models/Users');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DATABASE_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

async function createAdminUser() {
	//console.log('HERE :' + await UserEntry.find({role: 'admin'}));
	const user = await UserEntry.find({role: 'admin'});
	if (Object.keys(user).length === 0) {
		const userIn = new UserEntry({
			username: 'admin@admin.com',
			password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD,12),
			active: true,
			role: 'admin'
		});
		const UserIn = await userIn.save();
		console.log(UserIn);
	} else {
		console.log('admin exsits');
	}
    
	mongoose.disconnect();
} 



createAdminUser();
