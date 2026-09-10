const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

router.post("/upload", upload.array("images", 5), async (req, res) => {
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

    res.status(200).json({
      success: true,
      images: uploadedImages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
});

module.exports = router;