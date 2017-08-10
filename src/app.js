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
		type: Sequelize.STRING
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

const Comment = connection.define('comments', {
	comments: {
		type: Sequelize.STRING
		// allowNull: false
	},
},  {
		timestamps:false
	});


// Model Relationships
User.hasMany(Blogs);
Blogs.hasMany(Comment);
User.hasMany(Comment);

Comment.belongsTo(Blogs);
Comment.belongsTo(User);
Blogs.belongsTo(User);

connection.sync();


// REGISTER PAGE

app.get('/register/new', (req, res) => {
	res.render('register')
});

app.post('/registeruser', (req,  res) =>{
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
		console.log("Error" + err);
	})

});

// BLOG WALL (ALL BLOGS)

app.get('/wall', (req, res) => {
	var user = req.session.user;
	console.log(user);
	if(user === undefined){
		res.redirect('/login?message=' + encodeURIComponent('Please log in to view all posts.'))
	} else {
		User.findAll() // first query 
			.then((everyuser) => {
				Blogs.findAll({ // second query 
				include: [{ // only works for one model - can't get info from two models in one query 
						model: Comment, // comment model name
						as: 'comments' // the alias 
					}]
				})
			.then((everypost) => {
				res.render('blogwall', {everypost: everypost, users:everyuser})
			})
			.catch((err) => {
				console.log("Error" + err)
			})
		});
	}
					
});

app.post('/comments', (req,res) => {
	var user = req.session.user.username;
	console.log(user);

	User.findOne({
		where: {
			username: user, // where the username (table column) is equal to the user in the session
		}
	})
	.then((theuser) => {
		return theuser.createComment({
			comments:req.body.comments,
			userId: req.body.userId,
			blogId: req.body.blogId
		})
		.then(() => {
			res.redirect('/wall')
		})

	})
	.catch((err) => {
		console.log('Error: ' + err)
	})
});

// LOGIN PAGE

app.get('/', (req, res) => {
	res.render('index', {
		message: req.query.message,
		user: req.session.user             
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
		console.log("Error" + err)
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
}); 

// LOG OUT 
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
		console.log("Error" + err);
	})
});


// PROFILE PAGE/POSTS
app.get('/myposts', (req, res) => {
	const user = req.session.user;
	if(user === undefined){
		res.redirect('login/?message=' + encodeURIComponent("Please log in to view your posts."));
	} else {
		User.findAll({
			where: {
				id: user.id // filter it where the column id equals the user of this
			}, 
			include: [{
				model: Comment,
				as: 'comments'
			}]
		})
		.then((users) => { 	 // this will include comments if they exist		
			Blogs.findAll()
			.then((post) => {
				res.render('profileposts', {users:users, list:post})
			})
		})
		.catch((err) => {
			console.log('Error: ' + err);
			res.redirect('/?message=' + encodeURIComponent("Error."));
		});
	}
});


// SERVER

const server = app.listen(3000, () => {
	console.log("Blog app listening on port: " + server.address().port)
});

