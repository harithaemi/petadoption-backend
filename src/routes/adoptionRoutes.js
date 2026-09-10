const express = require("express");

const {
  createAdoptionApplication,
  getMyAdoptionApplications,
} = require("../controllers/adoptionController");

const {
  createFosterApplication,
  getMyFosterApplications,
} = require("../controllers/fosterController");

const {
  getAllPets,
  getPetById,
} = require("../controllers/petController");

const {
  getUserProfile, updateUserProfile
} = require("../controllers/userProfileController");

const userAuth = require("../middleware/authMiddleware");

const router = express.Router();



router.get("/userfeed", userAuth, getAllPets);



router.get("/pet/:id", userAuth, getPetById);


router.post("/adoptionapplication", userAuth, createAdoptionApplication);

router.get("/applications", userAuth, getMyAdoptionApplications);



router.post("/fosterapplication", userAuth, createFosterApplication);

router.get("/foster/applications", userAuth, getMyFosterApplications);



router.get("/profile", userAuth, getUserProfile);

router.patch("/profile", userAuth, updateUserProfile);
module.exports = router;