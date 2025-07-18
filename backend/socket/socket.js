const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const NotificationService = require('../utils/notificationService');

const setupSocketIO = (io) => {
  // Initialize notification service
  const notificationService = new NotificationService(io);
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);
    console.log('Socket ID:', socket.id, 'User ID:', socket.userId);
    console.log('Initial rooms:', Array.from(socket.rooms));

    // Join user to their personal room
    socket.join(socket.userId.toString());
    console.log('After joining personal room:', Array.from(socket.rooms));

    // Update user's online status
    User.findByIdAndUpdate(socket.userId, { 
      lastSeen: new Date() 
    }).exec();

    // Handle joining chat room
    socket.on('join-chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        
        if (chat && chat.participants.includes(socket.userId)) {
          socket.join(chatId);
          socket.currentChatId = chatId;
          
          // Mark messages as read
          await chat.markAsRead(socket.userId);
          
          socket.emit('chat-joined', { chatId });
          console.log('After joining chat room:', chatId, 'Socket rooms:', Array.from(socket.rooms));
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      socket.currentChatId = null;
      socket.emit('chat-left', { chatId });
    });

    // Handle sending message
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, messageType = 'text', fileUrl = '', fileName = '' } = data;
        
        const chat = await Chat.findById(chatId);
        
        if (!chat || !chat.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Chat not found or access denied' });
        }

        // Add message to chat
        await chat.addMessage(socket.userId, content, messageType, fileUrl, fileName);
        
        // Populate the last message for broadcasting
        await chat.populate('messages.sender', 'username firstName lastName avatar');
        
        const lastMessage = chat.messages[chat.messages.length - 1];
        
        // Broadcast message to all participants in the chat
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId.toString()) {
            io.to(participantId.toString()).emit('new-message', {
              chatId,
              message: lastMessage,
              sender: socket.user
            });
            
            // Create notification for the recipient
            notificationService.createMessageNotification(
              socket.userId,
              participantId,
              chatId,
              lastMessage._id,
              content
            );
          }
        });

        // Send confirmation to sender
        socket.emit('message-sent', {
          chatId,
          message: lastMessage
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing-start', (chatId) => {
      socket.to(chatId).emit('user-typing', {
        chatId,
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('typing-stop', (chatId) => {
      socket.to(chatId).emit('user-stop-typing', {
        chatId,
        userId: socket.userId
      });
    });

    // Handle read receipts
    socket.on('mark-read', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        
        if (chat && chat.participants.includes(socket.userId)) {
          await chat.markAsRead(socket.userId);
          
          // Notify other participants
          chat.participants.forEach(participantId => {
            if (participantId.toString() !== socket.userId.toString()) {
              io.to(participantId.toString()).emit('messages-read', {
                chatId,
                userId: socket.userId
              });
            }
          });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle online status
    socket.on('set-online-status', async (status) => {
      try {
        await User.findByIdAndUpdate(socket.userId, { 
          lastSeen: new Date() 
        });
        
        // Broadcast online status to followers
        const user = await User.findById(socket.userId).populate('followers');
        
        user.followers.forEach(follower => {
          io.to(follower._id.toString()).emit('user-status-change', {
            userId: socket.userId,
            status: 'online',
            lastSeen: new Date()
          });
        });
      } catch (error) {
        console.error('Set online status error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      try {
        // Update last seen
        await User.findByIdAndUpdate(socket.userId, { 
          lastSeen: new Date() 
        });
        
        // Broadcast offline status to followers
        const user = await User.findById(socket.userId).populate('followers');
        
        user.followers.forEach(follower => {
          io.to(follower._id.toString()).emit('user-status-change', {
            userId: socket.userId,
            status: 'offline',
            lastSeen: new Date()
          });
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    // Handle notification events
    socket.on('mark-notification-read', async (notificationId) => {
      try {
        const notification = await require('../models/Notification').findOne({
          _id: notificationId,
          recipient: socket.userId
        });
        
        if (notification) {
          await notification.markAsRead();
          await notificationService.updateUnreadCount(socket.userId);
        }
      } catch (error) {
        console.error('Mark notification read error:', error);
      }
    });

    socket.on('mark-all-notifications-read', async () => {
      try {
        await notificationService.markAllNotificationsAsRead(socket.userId);
      } catch (error) {
        console.error('Mark all notifications read error:', error);
      }
    });

    // Handle editing a message
    socket.on('edit-message', async ({ chatId, messageId, newContent }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Chat not found or access denied' });
        }
        const msg = chat.messages.id(messageId);
        if (!msg) {
          return socket.emit('error', { message: 'Message not found' });
        }
        if (msg.sender.toString() !== socket.userId.toString()) {
          return socket.emit('error', { message: 'You can only edit your own messages' });
        }
        msg.content = newContent;
        await chat.save();
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit('message-edited', {
            chatId,
            message: msg
          });
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle deleting a message
    socket.on('delete-message', async (data) => {
      try {
        const { chatId, messageId } = data;
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Chat not found or access denied' });
        }
        await chat.deleteMessage(messageId, socket.userId);
        // Notify all participants in the chat
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit('message-deleted', {
            chatId,
            messageId
          });
        });
      } catch (error) {
        socket.emit('error', { message: error.message || 'Failed to delete message' });
      }
    });
  });
};

module.exports = { setupSocketIO }; 