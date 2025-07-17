const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
require('dotenv').config();

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get some test users
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users to test notifications');
      return;
    }

    const [user1, user2] = users;
    console.log(`Testing with users: ${user1.username} and ${user2.username}`);

    // Test creating a notification
    const testNotification = await Notification.createNotification({
      recipient: user2._id,
      sender: user1._id,
      type: 'follow',
      title: `${user1.firstName} ${user1.lastName} started following you`,
      message: 'You now have a new follower!',
      data: {
        url: `/profile/${user1.username}`,
        image: user1.avatar
      }
    });

    console.log('✅ Created test notification:', testNotification._id);

    // Test getting unread count
    const unreadCount = await Notification.getUnreadCount(user2._id);
    console.log(`✅ Unread count for ${user2.username}: ${unreadCount}`);

    // Test marking as read
    await testNotification.markAsRead();
    console.log('✅ Marked notification as read');

    // Test getting updated unread count
    const updatedUnreadCount = await Notification.getUnreadCount(user2._id);
    console.log(`✅ Updated unread count: ${updatedUnreadCount}`);

    // Test getting notifications
    const notifications = await Notification.find({ recipient: user2._id })
      .populate('sender', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${notifications.length} notifications for ${user2.username}`);

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testNotifications(); 