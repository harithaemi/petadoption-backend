const express = require("express");

const {
  createPet,
  getMyPets,
  updatePet,
  deletePet,
} = require("../controllers/petController");

const {
  getReceivedAdoptionApplications,
  updateAdoptionApplicationStatus,
} = require("../controllers/adoptionController");

const {
  getReceivedFosterApplications,
  updateFosterApplicationStatus,
} = require("../controllers/fosterController");

const {
  getShelterProfile,
  updateShelterProfile,
} = require("../controllers/shelterProfileController");

const userAuth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();


router.get("/profile", userAuth, getShelterProfile);

router.patch("/profile", userAuth, updateShelterProfile);



router.post("/pets", upload.array("images", 5),  userAuth, createPet);

router.get("/feed", userAuth, getMyPets);
router.patch(
  "/pet/:id",
  userAuth,
  upload.array("images", 5),
  updatePet
);

router.delete("/pet/:id", userAuth, deletePet);



router.get(
  "/applications/adoption",
  userAuth,
  getReceivedAdoptionApplications
);

router.patch(
  "/applications/adoption/:id/status",
  userAuth,
  updateAdoptionApplicationStatus
);



router.get(
  "/applications/foster",
  userAuth,
  getReceivedFosterApplications
);

router.patch(
  "/applications/foster/:id/status",
  userAuth,
  updateFosterApplicationStatus
);


module.exports = router;