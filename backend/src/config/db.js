const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/three-way-match';
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${uri}`);
}

module.exports = { connectDb };
