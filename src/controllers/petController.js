const Pet = require("../models/Pets");
const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "pet-adoption/pets",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

const createPet = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pet images are required",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadImage(file.buffer))
    );

    const pet = await Pet.create({
      ...req.body,
      images: uploadedImages.map((image) => image.secure_url),
      shelter: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      pet,
    });
  } catch (error) {
    console.error("Create pet error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find({ status: "available" }).populate(
      "shelter",
      "userName emailId phoneNumber"
    );

    res.status(200).json({
      success: true,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate(
      "shelter",
      "userName emailId phoneNumber"
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPets = async (req, res) => {
  try {
    const pets = await Pet.find({
      shelter: req.user._id,
    });

    res.status(200).json({
      success: true,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (pet.shelter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this pet",
      });
    }

    if (req.body.petName !== undefined) pet.petName = req.body.petName;
    if (req.body.gender !== undefined) pet.gender = req.body.gender;
    if (req.body.age !== undefined) pet.age = req.body.age;
    if (req.body.location !== undefined) pet.location = req.body.location;
    if (req.body.ownerName !== undefined) pet.ownerName = req.body.ownerName;
    if (req.body.contactNumber !== undefined) pet.contactNumber = req.body.contactNumber;
    if (req.body.breed !== undefined) pet.breed = req.body.breed;
    if (req.body.ownerEmail !== undefined) pet.ownerEmail = req.body.ownerEmail;
    if (req.body.city !== undefined) pet.city = req.body.city;
    if (req.body.about !== undefined) pet.about = req.body.about;
    if (req.body.status !== undefined) pet.status = req.body.status;

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) => uploadImage(file.buffer))
      );

      pet.images = uploadedImages.map((image) => image.secure_url);
    }

    await pet.save();

    res.status(200).json({
      success: true,
      message: "Pet updated successfully",
      pet,
    });
  } catch (error) {
    console.error("Update pet error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findOneAndDelete({
      _id: req.params.id,
      shelter: req.user._id,
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPet,
  getAllPets,
  getPetById,
  getMyPets,
  updatePet,
  deletePet,
};

