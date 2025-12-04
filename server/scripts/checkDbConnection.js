const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');

async function checkDb() {
  try {
    console.log('Connecting to DB...');
    // Log the URI (masking password) to verify DB name
    const uri = process.env.MONGODB_URI;
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`URI: ${maskedUri}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to database: ${mongoose.connection.name}`);
    
    const users = await User.find({}, 'username email createdAt');
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.username} (${u.email}) [${u.createdAt}]`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDb();
