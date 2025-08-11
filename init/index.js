const mongoose = require('mongoose');
const initData = require('./data');
const Listing = require('../models/listing');


const MONGO_URL = 'mongodb://127.0.0.1:27017/wonderLust'

async function main(){
    await mongoose.connect(MONGO_URL)
}

main()
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

const initDb = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log('Database initialized with sample data');
}

initDb();