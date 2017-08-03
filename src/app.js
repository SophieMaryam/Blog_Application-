const express = require('express'); // requiring express module 
const app = express(); // instantiating express 

const bodyParser = require('body-parser'); // requiring body-parser module - parses the data we are receiving from the user so we can use it 

app.use('/', bodyParser.urlencoded({extended:true}));

// Setting up Sequelize
const Sequelize = require('sequelize');
const connection = new Sequelize('blogapplication', 'postgres', '1626', {
	host: 'localhost',
	dialect: 'postgres'
});

// Setting up Pug
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// CSS Page
app.use(express.static(__dirname + "/../public"));

// Model Definition (This will be for creating your account)

const User = connection.define('user', {
	username: {
		type: Sequelize.STRING,
		isNull: false,
	}, 
	email: {
		type: Sequelize.STRING,
		unique:true,
		isEmail: true
	},
	password: {
		type: Sequelize.STRING
	} 
	}, {
		timestamps:false
	});

connection.sync();

// Register page
app.get('/register/new', (req, res) => {
	res.render('register')
});

app.post('/registeruser', (req,  res) =>{
	User.create({
		username: req.body.registername,
		email: req.body.registeremail,
		password: req.body.registerpassword
	})
	.then(() => {
		res.redirect('/wall')
	})
	.catch((err) => {
		console.log(err);
	})

});

// Blog Wall

app.get('/wall', (req, res) => {
	res.render('blogwall')
});

// // login Page
// app.get('/', (req, res) => {
// 	res.render('index');
// });

// app.post('/bloglogin', (req, res) => {
// 	let username = 	req.body.username,
// 	email = req.body.email,
// 	password = req.body.password;

// 	console.log(req.body.username);
// 	console.log(req.body.email);
// 	console.log(req.body.password);


// 	User.findOne({
// 		where: {
// 			name: req.body.username
// 		}
// 	})

// 	})
// })








const server = app.listen(3000, () => {
	console.log("Blog app listening on port: " + server.address().port)
});