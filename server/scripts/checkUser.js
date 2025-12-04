require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const user = await User.findOne({ username: 'testuser1000' });
    if (user) {
      console.log('User found:', user);
    } else {
      console.log('User NOT found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkUser();
