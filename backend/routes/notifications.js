const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Get notifications for the current user with pagination

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id, isDeleted: { $ne: true } };

    const notifications = await Notification.find(query)
      .populate("sender", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  })
);

// Get unread notifications count
router.get(
  "/unread-count",
  protect,
  asyncHandler(async (req, res) => {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { unreadCount },
    });
  })
);

// Mark notification as read
router.put(
  "/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    }).populate("sender", "firstName lastName username avatar");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: notification,
    });
  })
);

// Mark multiple notifications as read
router.put(
  "/mark-read",
  protect,
  asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Notification IDs array is required",
      });
    }

    const result = await Notification.markAsRead(notificationIds, req.user._id);

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount },
    });
  })
);

// Mark all notifications as read
router.put(
  "/mark-all-read",
  protect,
  asyncHandler(async (req, res) => {
    const result = await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount },
    });
  })
);

// Delete notification
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    }).populate("sender", "firstName lastName username avatar");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.deleteNotification();

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  })
);

// Delete multiple notifications
router.delete(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Notification IDs array is required",
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: req.user._id,
      },
      { isDeleted: true }
    );

    res.json({
      success: true,
      data: { deletedCount: result.modifiedCount },
    });
  })
);

// Get notification settings
router.get(
  "/settings",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("notificationPrefs");

    res.json({
      success: true,
      data: user.notificationPrefs,
    });
  })
);

// Update notification settings
router.put(
  "/settings",
  protect,
  asyncHandler(async (req, res) => {
    const { email, push, marketing } = req.body;

    const updateData = {};
    if (typeof email === "boolean")
      updateData["notificationPrefs.email"] = email;
    if (typeof push === "boolean") updateData["notificationPrefs.push"] = push;
    if (typeof marketing === "boolean")
      updateData["notificationPrefs.marketing"] = marketing;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select("notificationPrefs");

    res.json({
      success: true,
      data: user.notificationPrefs,
    });
  })
);

// Get collaboration notifications
router.get(
  "/collaboration",
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
      recipient: req.user._id,
      type: {
        $in: [
          "review_request",
          "review_response",
          "fork_created",
          "fork_received",
          "collaboration_invite",
        ],
      },
    })
      .populate("sender", "firstName lastName username avatar")
      .populate("data.postId", "title")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: notifications,
    });
  })
);

// Mark collaboration notification as read
router.put(
  "/collaboration/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    ).populate("sender", "firstName lastName username avatar");

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      data: notification,
    });
  })
);

// Mark all collaboration notifications as read
router.put(
  "/collaboration/read-all",
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        type: {
          $in: [
            "review_request",
            "review_response",
            "fork_created",
            "fork_received",
            "collaboration_invite",
          ],
        },
      },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All collaboration notifications marked as read",
    });
  })
);

module.exports = router;
