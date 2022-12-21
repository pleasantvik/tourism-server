const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const User = require("../model/userModel");
const AppError = require("../utils/appError");
const Factory = require("./handleFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //Loop through the obj. Check if the field is part of the allowed paramter
  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) newObj[field] = obj[field];
  });
  return newObj;
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const user = await User.find();

//   res.status(httpStatus.OK).json({
//     status: "success",
//     data: { user },
//   });
// });
// exports.getUser = (req, res, next) => {
//   res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
//     status: "error",
//     message: "This route is not yet defined",
//   });
// };
exports.createUser = (req, res, next) => {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: "This route is defined! Please use /signup instead",
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    message: "User account deleted successfully",
    data: null,
  });
});

// Update user who is login
exports.updateMe = catchAsync(async (req, res, next) => {
  //Uploading images
  // console.log(req.file);
  // console.log(req.body);
  //1. Create error if user tries updating password from this route
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        "This route is not for password update, please use /updateMyPassword",
        httpStatus.UNAUTHORIZED
      )
    );

  //2. Filter out unwanted field
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteUser = Factory.deleteOne(User);
exports.updateUser = Factory.updateOne(User);
exports.getUser = Factory.getOne(User);
exports.getAllUsers = Factory.getAll(User);
