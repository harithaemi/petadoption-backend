const express = require("express");

const {
  createReview,
  getPetReviews,
} = require("../controllers/reviewController");

const userAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", userAuth, createReview);

router.get("/:petId", getPetReviews);

module.exports = router;