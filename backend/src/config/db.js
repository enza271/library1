const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  const conn = await mongoose.connect(mongoUri);
  return conn;
};

module.exports = connectDB;
