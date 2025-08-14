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
    initData.data = initData.data.map(obj => {
        return { ...obj, owner: "689e501082c16f0fdcbb604d" }; // Assign a default owner ID
    });
    await Listing.insertMany(initData.data);
    console.log('Database initialized with sample data');
}

initDb();