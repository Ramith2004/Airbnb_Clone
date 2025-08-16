require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const initData = require('./data');
const Listing = require('../models/listing');

const MONGO_URL = process.env.ATLASDB_URL;

// Add debug logging to check if the variable is loaded
console.log('MONGO_URL:', MONGO_URL);

async function main(){
    if (!MONGO_URL) {
        throw new Error('ATLASDB_URL environment variable is not set');
    }
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => {
        console.log('Connected to MongoDB');
        return initDb();
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });

const initDb = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map(obj => {
        return { ...obj, owner: "68a0eeac5e0b62395ec3dc79" };
    });
    await Listing.insertMany(initData.data);
    console.log('Database initialized with sample data');
    mongoose.connection.close();
}