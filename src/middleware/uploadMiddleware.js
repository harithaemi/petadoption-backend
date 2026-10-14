
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedTypes = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".jfif": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".mp4": ["video/mp4"],
  ".webm": ["video/webm"],
  ".mov": ["video/quicktime"],
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 5,
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedTypes = allowedTypes[extension];

    if (!expectedTypes || !expectedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only supported image and video files are allowed")
      );
    }

    cb(null, true);
  },
});

module.exports = upload;
