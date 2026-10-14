
const express = require("express");
const router = express.Router();

const userAuth = require("../middleware/authMiddleware");
const shelterOnly = require("../middleware/shelterOnly");
const upload = require("../middleware/uploadMiddleware");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

router.post(
  "/upload",
  userAuth,
  shelterOnly,
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file.buffer,
          file.mimetype
        );

        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }

      return res.status(200).json({
        success: true,
        images: uploadedImages,
      });
    } catch (error) {
      console.error("Image upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }
  }
);

module.exports = router;
