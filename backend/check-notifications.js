const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
require('dotenv').config();

async function checkNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all notifications
    const notifications = await Notification.find()
      .populate('sender', 'username firstName lastName')
      .populate('recipient', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📊 Found ${notifications.length} notifications:`);
    
    notifications.forEach((notification, index) => {
      console.log(`\n${index + 1}. Notification ID: ${notification._id}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Sender: ${notification.sender?.firstName} ${notification.sender?.lastName}`);
      console.log(`   Recipient: ${notification.recipient?.firstName} ${notification.recipient?.lastName}`);
      console.log(`   Is Read: ${notification.isRead}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log(`   Data:`, notification.data);
    });

    // Get unread count for each user
    const users = await User.find().limit(5);
    console.log('\n📈 Unread counts:');
    for (const user of users) {
      const unreadCount = await Notification.getUnreadCount(user._id);
      console.log(`   ${user.firstName} ${user.lastName}: ${unreadCount} unread`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkNotifications(); 