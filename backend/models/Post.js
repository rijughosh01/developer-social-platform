const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    maxlength: [10000, 'Content cannot exceed 10000 characters'],
    validate: {
      validator: function (v) {
        // Only require content for regular posts
        return this.type === 'code' ? true : (v && v.trim().length > 0);
      },
      message: 'Post content is required'
    }
  },
  code: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        // Only require code for code posts
        return this.type === 'code' ? (v && v.trim().length > 0) : true;
      },
      message: 'Code is required for code posts'
    }
  },
  codeLanguage: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['regular', 'code'],
    default: 'regular'
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['general', 'tutorial', 'project', 'news', 'opinion', 'review'],
    default: 'general'
  },
  image: {
    type: String,
    default: ''
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  isPublished: {
    type: Boolean,
    default: true
  },
  readTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for likes count
postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Index for search
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Calculate read time before saving
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(' ').length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

// Method to add like
postSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Method to remove comment
postSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => 
    comment._id.toString() !== commentId.toString()
  );
  return this.save();
};

// Method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Post', postSchema); 