const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const middleware = require("../middleware");

module.exports.signupForm = (_req, res) => {
  res.render("users/signup.ejs");
}

module.exports.createUser = async (req, res) => {
  try{
    const { email, username, password } = req.body;
  const newuser = new User({ email, username });
  const registeredUser = await User.register(newuser, password);
//   console.log(registeredUser);
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
}

module.exports.loginForm = (_req, res) => {
  res.render("users/login.ejs");
}

module.exports.loginUser = async (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect(res.locals.redirectUrl);
  }

  module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Goodbye!");
      res.redirect("/listings");
    });
  }