const express = require('express'); // requiring express module 
const app = express(); // instantiating express 

const bodyParser = require('body-parser'); // requiring body-parser module - parses the data we are receiving from the user so we can use it 

app.use('/', bodyParser.urlencoded({extended:true}));

// Model Configuration 
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

// Sessions

const session = require('express-session'); // requiring session module 

app.use(session({
	secret: "This is a secret",
	resave:false, // you stay longed in when you switched 
	saveUninitialized: true

}));

// Model Definition (This will be for creating your account)

const User = connection.define('user', {
	username: {
		type: Sequelize.STRING,
		unique:true,
		allowNull: false
	}, 
	email: {
		type: Sequelize.STRING,
		unique:true,
		allowNull: false
	},
	password: {
		type: Sequelize.STRING,
	},
},  {
		timestamps:false
	});


const Blogs = connection.define('blogs', {
	title: {
		type: Sequelize.STRING,
		allowNull: false
		},
	blog: {
		type: Sequelize.STRING,
		allowNull: false
	},
},  {
		timestamps:false
	});

const Comments = connection.define('comments', {
	comments: {
		type: Sequelize.STRING,
		allowNull: false
	},
},  {
		timestamps:false
	});

connection.sync();

// REGISTER PAGE

app.get('/user/new', (req, res) => {
	res.render('register')
});

app.post('/user', (req,  res) =>{
	User.create({
		username: req.body.registername,
		email: req.body.registeremail,
		password: req.body.registerpassword
	})
	.then((user) => {
		req.session.user = user // req.session.the name of your table you are linking to
		res.redirect(`/profile/${user.id}`)
	})
	.catch((err) => {
		console.log(err);
	})

});

// BLOG WALL (ALL BLOGS)

app.get('/wall', (req, res) => {
	Blogs.findAll().then(function(everyblogpost){
		var data = everyblogpost.map((post) => {
			var title = post.dataValues.title;
			var blogs = post.dataValues.blog;
			return {
				title: title,
				blogs: blogs
			}
		})
		res.render('blogwall', {info: data})
		})					
});

// One to many relationship (User and Blogs)

User.hasMany(Blogs);
(Blogs).belongsTo(User);


// Many to Many Relationships (Blogs, Comments, and Users)

// User.belongsToMany(Blogs, {through:Comments});
// Blogs.belongsToMany(Users, {through:Comments});

// Comments.belongsToMany(User, {through:Blogs});
// User.belongsToMany(Comments, {through:Blogs});

// Coments.belongsToMany(Blogs, {through:Users});
// Blogs.belongsToMany(Comments, {through:Users});

User.hasMany(Blogs);
Blogs.hasMany(Comments);
User.hasMany(Comments);

Comments.belongsTo(Blogs);
Comments.belongsTo(User);
Blogs.belongsTo(User);


// LOGIN PAGE

app.get('/', (req, res) => {
	res.render('index', {
		message: req.query.message,
		user: req.session.user               // ??????
	});
});

app.post('/bloglogin', (req, res) => {
	console.log(req.body.email);
	console.log(req.body.password);

	if(req.body.email.length === 0){
		res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;	
	}

	if(req.body.password.length === 0){
		res.redirect('/?message=' + encodeURIComponent("Please fill our your password."));
		return;
	}

	User.findOne({
		where: {
			email: req.body.email
		}
	}).then(function(user){
		if(user !== null && req.body.password === user.password){
			req.session.user = user;
			res.redirect(`/profile/${user.id}`)
		}
	}).catch(function(err){
		console.log(err)
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
}); 

app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if(err){
			throw err;
		}
		res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
});

// PROFILE PAGE

app.get('/profile/:id', (req, res) => {
	var user = req.session.user;
	if(user === undefined){
		res.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
	} else {
		res.render('profile', {
			user:user
		});
	}
});


// SERVER

const server = app.listen(3000, () => {
	console.log("Blog app listening on port: " + server.address().port)
});

