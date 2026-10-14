
const shelterOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "shelter") {
    return res.status(403).json({
      success: false,
      message: "Only shelter accounts can perform this action",
    });
  }

  next();
};

module.exports = shelterOnly;
