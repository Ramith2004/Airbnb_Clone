const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

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
  res.send("Hello World!");
});

//Index Route
app.get("/listings", wrapAsync(async (_req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
}));

//New Route
app.get("/listings/new", (_req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
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
    await listing.save();
    res.redirect("/listings");
  })
);

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
app.put("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, location, country } = req.body;
  const listing = await Listing.findByIdAndUpdate(
    id,
    { title, description, price, location, country },
    { new: true }
  );
  res.redirect(`/listings`);
}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
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
