const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    image: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    liveUrl: {
      type: String,
      default: "",
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      enum: [
        "web",
        "mobile",
        "desktop",
        "api",
        "library",
        "tool",
        "game",
        "other",
      ],
      default: "web",
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "archived", "planning"],
      default: "completed",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    views: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["developer", "designer", "tester", "manager"],
          default: "developer",
        },
      },
    ],
    screenshots: [
      {
        url: String,
        caption: String,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for likes count
projectSchema.virtual("likesCount").get(function () {
  return this.likes ? this.likes.length : 0;
});



// Index for search
projectSchema.index({
  title: "text",
  description: "text",
  technologies: "text",
  tags: "text",
});

// Method to add like
projectSchema.methods.addLike = function (userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
projectSchema.methods.removeLike = function (userId) {
  this.likes = this.likes.filter((id) => id.toString() !== userId.toString());
  return this.save();
};

// Method to increment views
projectSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to add collaborator
projectSchema.methods.addCollaborator = function (userId, role = "developer") {
  const existingCollaborator = this.collaborators.find(
    (collab) => collab.user.toString() === userId.toString()
  );

  if (!existingCollaborator) {
    this.collaborators.push({
      user: userId,
      role: role,
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove collaborator
projectSchema.methods.removeCollaborator = function (userId) {
  this.collaborators = this.collaborators.filter(
    (collab) => collab.user.toString() !== userId.toString()
  );
  return this.save();
};

module.exports = mongoose.model("Project", projectSchema);
