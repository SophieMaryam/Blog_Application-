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
// Blogs.belongsToMany(User, {through:Comments});

// Comments.belongsToMany(User, {through:Blogs});
// User.belongsToMany(Comments, {through:Blogs});

// Comments.belongsToMany(Blogs, {through:User});
// Blogs.belongsToMany(Comments, {through:User});

User.hasMany(Blogs);
Blogs.hasMany(Comments);
User.hasMany(Comments);

Comments.belongsTo(Blogs);
Comments.belongsTo(User);
Blogs.belongsTo(User);

app.post('/comments', (req,res) => {
	Blogs.create({
		comment: req.body.comment,
	})
	.then(() => {
		res.redirect('/wall')
	})
	.catch((err) => {
		console.log(err);
	})
})

app.get('/wall', (req,res) => {
	Blogs.findAll({
		include: [
			{
				model:users,
			}
		],
		include: [
			{
				model:comments,
			}
		]
	}).then(data => {
		res.render('blogwall', {info:data})
	})
});


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

app.post('/writingblog', (req, res) => {
	Blogs.create({
		title: req.body.title,
		blog: req.body.blog,
		userId: req.session.user.id
	})
	.then(() => {
		res.redirect('/wall')
	})
	.catch((err) => {
		console.log(err);
	})
});


// PROFILE PAGE/POSTS
app.get('/myposts', (req, res) => {
	const user = req.session.user;
	Blogs.findAll({
		where: req.session.user.id
	}).then((post) => {
		res.render('profileposts', {list: post})
	})	
});


// SERVER

const server = app.listen(3000, () => {
	console.log("Blog app listening on port: " + server.address().port)
});

