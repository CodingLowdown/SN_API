const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();
const app = express();
const Company = require('./api/Company');
const People = require('./api/People');
const Delete = require('./api/Delete');
const middlewares = require('./middlewares');
const authMiddlewares = require('./auth/middlewares');
const mongoose = require('mongoose');
const auth = require('./auth/index');
const authin = require('./auth/login');
const users = require('./auth/users');

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DATABASE_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

app.use(morgan('common'));
app.use(helmet());
app.use(cors({
	origin: process.env.CORS_ORIGIN
}));

app.use(authMiddlewares.checkTokenSetUser);
app.get('/',(req,res) => {
	res.json({
		message: 'Hello World!',
		user: req.user,
	});
});
app.use(express.json());

app.use('/auth/signup',authMiddlewares.isAdmin,auth);
app.use('/auth/login',authin);

app.use('/auth/users',authMiddlewares.isAdmin,users);

app.use('/api/companySearch/:companyName',authMiddlewares.isLoggedIn,Company);
app.use('/api/delete/:search/:first/:last/:companyName',authMiddlewares.isLoggedIn,Delete);
app.use('/api/peopleSearch/',authMiddlewares.isLoggedIn,People);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);


const port = process.env.PORT || PORT;
app.listen(port, () => {
	console.log(`Listening at http://localhost:${port}`);
});