//jshint esversion:6
const express               =  require("express"),
    app                   = express(),  // *
    methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    expressSanitizer      = require("express-sanitizer"),
    session               = require("express-session"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),

    //    MODELS

    User                  = require("./models/user"), // USER MODEL
    Blog                  = require("./models/blog"), // BLOG MODEL

    mongoose              = require("mongoose");

//Express Session
app.use(session({
    // Set Secret to decode session information
    secret: "you",
    // Other required properties
    resave: false,
    saveUninitialized: false
}));
// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/restfulblog",{
   useMongoClient: true
}); // Connect to restfulblog DB
mongoose.set("useCreateIndex",true);
// EJS
app.set("view engine", "ejs");

// Tell Express to use public directory
app.use(express.static(__dirname + "/public"));

// Body Parser
app.use(bodyParser.urlencoded({extended: true}));

// Method Override
app.use(methodOverride("_method"));

// Express Sanitizer
app.use(expressSanitizer());
// Required Passport Methods
app.use(passport.initialize());
app.use(passport.session());

// inorder to authenticate via username and password use local-strategy
passport.use(new LocalStrategy(User.authenticate()));

// inorder to support login request
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




// -----===------    BLOG ROUTES    -----===------



// ROOT
app.get("/", function(req, res){
   res.render("home");
});


// INDEX
app.get("/blogs", isLoggedIn, function(req, res){

    // Grab all blogs from db
    Blog.find({}, function(err, blogs){

        if (err){
            console.log(err);
        } else {
            res.render("index", {blogs: blogs});
        }

    }).sort({
      create: 'desc'
    });

});


// NEW - Display form
app.get("/blogs/new", isLoggedIn ,function(req, res){
    res.render("new");
});


// CREATE - Insert form data into db
app.post("/blogs", isLoggedIn ,function(req, res){

    // Sanitize data before it gets added into the database
    req.body.blog.body = req.sanitize(req.body.blog.body);


    // Create blog
    Blog.create(req.body.blog, function(err, newBlog){

        if (err) {
            console.log("There was a problem" + err);
            res.render("new");

        } else {
            res.redirect("/blogs");
        }

    });

});


// SHOW - Show all Blogs
app.get("/blogs/:id", isLoggedIn, function(req, res){

   Blog.findById(req.params.id, function(err, foundBlog){

        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", {blog: foundBlog});
        }
   });

});


// EDIT- Edit blog post
app.get("/blogs/:id/edit", isLoggedIn, function(req, res){

    Blog.findById(req.params.id, function(err, foundBlog){

        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("edit", {blog: foundBlog});
        }

   });

});


// UPDATE - Update database with new post from edit
app.put("/blogs/:id", isLoggedIn ,function(req, res){

   // Sanitize data before it gets added into the database
    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){

        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }

    });

});


// DELETE - Delete post from database
app.delete("/blogs/:id", isLoggedIn,function(req, res){
    // Destroy
    Blog.findByIdAndRemove(req.params.id, function(err){

        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/");
        }

    });

});



// -----===------   AUTH ROUTES     -----===------

// Show Sign Up Form
app.get("/register", function(req, res){
    res.render("register");
});


// Secret Page
app.get("/secret", isLoggedIn,function(req, res){
   res.render("secret");
});

app.post("/register", function(req, res){
    // Creates a new user - Doesn't actually save to db. Send password as a separate parameter
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            // Actually Logs the user in - Runs User.SerializeUser with local strategy
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secret");
            });
        }
    });
});


// Login Route
app.post("/login", passport.authenticate("local", {
    // Set where you want it to redirect to
    successRedirect: "/blogs",
    failureRedirect: "/",
    failureFlash: true
})
);


// Logout Route
app.get("/logout", function(req, res){
    req.logout(); // This is literally all we need to do to log the user out... wow!
    res.redirect("/");
});


// 404 - Or if page does not exist
app.get("*", function(req, res){
   res.redirect("/blogs");
});


// MiddleWare - Check if logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/"); //else redirect to login route
}


// Server Start
app.listen(3000, function(){
    console.log("Server Started");
});
