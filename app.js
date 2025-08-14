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
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const { isLoggedIn, saveRedirectUrl, isOwner, isReviewAuthor } = require("./middleware");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const sessionOptions = {
      secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxage: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
}

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

// app.get("/demouser",async (req,res)=>{
//     let fakeUser = new User({
//         username: "demoUser",
//         email: "Student@gmail.com"
// });
// let registeredUser = await User.register(fakeUser, "password123" );
// res.send(registeredUser);
// });



// })

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsMate);

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderLust";

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
app.get("/users/signup", (_req, res) => {
  res.render("users/signup.ejs");
});

app.post("/users/signup", wrapAsync(async (req, res) => {
  try{
    const { email, username, password } = req.body;
  const newuser = new User({ email, username });
  const registeredUser = await User.register(newuser, password);
  console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "User registered successfully!");
    res.redirect("/listings");
    });
    
  }
  catch(e){
    req.flash("error", e.message);
    res.redirect("/users/signup");
  }
}));

//User login route
app.get("/users/login", (_req, res) => {
  res.render("users/login.ejs");
});

app.post("/users/login",saveRedirectUrl,passport.authenticate('local',{failureRedirect: '/users/login', failureFlash: true}), async(req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect(res.locals.redirectUrl );
});

//User logout route
app.get("/users/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
  
});

//Index Route
app.get("/listings", wrapAsync(async (_req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
}));

//New Route
app.get("/listings/new", isLoggedIn, (_req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews").populate("owner").populate({
    path: "reviews",
    populate: {
      path: "author"
    }
  });
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
}));

//Create Route
app.post(
  "/listings",
  wrapAsync(async (req, res, _next) => {
    const { title, description, price, location, country } = req.body;
    const listing = new Listing({
      title,
      description,
      price,
      location,
      country,
    });
    listing.owner = req.user._id;
    await listing.save();
    
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  })
);

//Edit Route
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
      
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
app.put("/listings/:id",isLoggedIn,isOwner , wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, location, country } = req.body;
  let listing = await Listing.findById(id);
  
  const updatedListing = await Listing.findByIdAndUpdate(
    id,
    { title, description, price, location, country },
    { new: true }
  );
  req.flash("success", "Listing edited successfully!");
  res.redirect(`/listings`);
}));

//Delete Route
app.delete("/listings/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
}));



//Review post route
app.post("/listings/:id/reviews", isLoggedIn, wrapAsync(async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id; // Set the author of the review
  console.log(newReview);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  
  req.flash("success", "Review added successfully!");
  res.redirect(`/listings/${listing._id}`); // Add this redirect
}));

//Review delete route
app.delete("/listings/:id/reviews/:reviewId", isReviewAuthor, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted successfully!");
  res.redirect(`/listings/${id}`);
}));

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
