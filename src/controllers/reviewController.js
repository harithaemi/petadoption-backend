const Review = require("../models/Review");
const Pet = require("../models/Pets");

const createReview = async (req, res) => {
  try {
    const { pet, rating, comment } = req.body;

    const existingPet = await Pet.findById(pet);

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const existingReview = await Review.findOne({
      pet,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this pet",
      });
    }

    const review = await Review.create({
      pet,
      user: req.user._id,
      rating,
      comment,
    });

   
    const reviews = await Review.find({ pet });

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    const averageRating = totalRating / reviews.length;

    await Pet.findByIdAndUpdate(pet, {
      ratingAverage: Number(averageRating.toFixed(1)),
      ratingCount: reviews.length,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted",
      review,
      ratingAverage: Number(averageRating.toFixed(1)),
      ratingCount: reviews.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPetReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      pet: req.params.petId,
    })
      .populate("user", "userName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createReview,
  getPetReviews,
};