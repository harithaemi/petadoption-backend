
const express = require("express");
const router = express.Router();

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
const shelterOnly = require("../middleware/shelterOnly");
const upload = require("../middleware/uploadMiddleware");

router.use(userAuth, shelterOnly);

router.get("/profile", getShelterProfile);
router.patch("/profile", updateShelterProfile);

router.post("/pets", upload.array("images", 5), createPet);
router.get("/feed", getMyPets);
router.patch("/pet/:id", upload.array("images", 5), updatePet);
router.delete("/pet/:id", deletePet);

router.get(
  "/applications/adoption",
  getReceivedAdoptionApplications
);

router.patch(
  "/applications/adoption/:id/status",
  updateAdoptionApplicationStatus
);

router.get(
  "/applications/foster",
  getReceivedFosterApplications
);

router.patch(
  "/applications/foster/:id/status",
  updateFosterApplicationStatus
);

module.exports = router;
