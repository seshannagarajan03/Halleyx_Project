const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  const connection = await mongoose.connect(mongoUri);
  return connection;
};

module.exports = connectDB;
