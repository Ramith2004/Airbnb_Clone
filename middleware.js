const Listing = require("./models/listing");
const Review = require("./models/review");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // path information
    req.session.redirectUrl= req.originalUrl; 
    req.flash("error", "You must be logged in to do that");
    return res.redirect("/users/login");
  }
  next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
    else {
        res.locals.redirectUrl = "/listings"; // Default fallback
    }
  next();
}

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not authorized to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) { // Changed from res.locals.currentUser to req.user
    req.flash("error", "You are not authorized to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
}