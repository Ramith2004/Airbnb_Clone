const Listing = require("../models/listing");

module.exports.index = async (_req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
}

module.exports.renderNewForm = (_req, res) => {
  res.render("listings/new.ejs");
}

module.exports.showListings = async (req, res) => {
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
  // console.log(listing);
  res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res, _next) => {
    const { title, description, price, location, country } = req.body;
    const listing = new Listing({
      title,
      description,
      image: {
        url: req.file.path,
        filename: req.file.filename
      },
      price,
      location,
      country,
    });
    listing.owner = req.user._id;
    await listing.save();
    
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  }
  module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    let originalImage = listing.image.url
    originalImage =originalImage.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImage });
  }

  module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, location, country } = req.body;
  let listing = await Listing.findById(id);
  
  // Prepare update object
  const updateData = { title, description, price, location, country };
  
  // Only update image if a new file was uploaded
  if (req.file) {
    updateData.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }
  // If no new file, keep existing image (don't update image field)
  
  const updatedListing = await Listing.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );
  
  req.flash("success", "Listing edited successfully!");
  res.redirect(`/listings`);
}

module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
}