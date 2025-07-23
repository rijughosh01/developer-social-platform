const express = require("express");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "devlink-posts",
    });
    // Clean up local file after upload
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Upload failed", error: err.message });
  }
});

module.exports = router;
