if(process.env.NODE_ENV != "production") {
  require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const Review = require("./models/review");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const {
  isLoggedIn,
  saveRedirectUrl,
  isOwner,
  isReviewAuthor,
} = require("./middleware");
const {
  index,
  renderNewForm,
  showListings,
  createListing,
  renderEditForm,
  updateListing,
  deleteListing,
  search,
} = require("./controllers/listings");
const { createReview, deleteReview } = require("./controllers/reviews");
const { signupForm, createUser, loginForm, loginUser, logoutUser } = require("./controllers/user");
const { cloudinary, storage } = require("./cloudconfig");
const multer  = require('multer')
const upload = multer({ storage })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  touchAfter: 24 * 3600, // time period in seconds
  crypto: {
    secret: process.env.SECRET 
  }
  
});

store.on("error", function (e) {
  console.log("Mongo Session Store Error", e);
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET ,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxage: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // Add currentUser to locals
  next();
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsMate);

// const MONGO_URL = "mongodb://127.0.0.1:27017/wonderLust";
const MONGO_URL = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(MONGO_URL);
}

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get("/", (_req, res) => {
  res.redirect("/listings");
});

//User registration route
app.get("/users/signup", signupForm);

app.post("/users/signup", wrapAsync(createUser));

//User login route
app.get("/users/login", loginForm);

app.post(
  "/users/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: true,
  }),
  loginUser
);


//User logout route
app.get("/users/logout", logoutUser);

//Index Route
app.get("/listings", wrapAsync(index));

//New Route
app.get("/listings/new", isLoggedIn, renderNewForm);
// Search Route
app.get("/listings/search", wrapAsync(search));
//Show Route
app.get("/listings/:id", wrapAsync(showListings));

//Create Route
app.post("/listings", isLoggedIn, upload.single('image'), wrapAsync(createListing));

//Edit Route
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(renderEditForm));

//Update Route
app.put("/listings/:id", isLoggedIn, isOwner, upload.single('image'), wrapAsync(updateListing));

//Delete Route
app.delete("/listings/:id", isLoggedIn, isOwner, wrapAsync(deleteListing));

//Review post route
app.post("/listings/:id/reviews", isLoggedIn, wrapAsync(createReview));

//Review delete route
app.delete(
  "/listings/:id/reviews/:reviewId",
  isReviewAuthor,
  wrapAsync(deleteReview)
);

app.all(/./, (_req, _res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

//Error Handling Middleware
app.use((err, _req, res, _next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).send(message);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
