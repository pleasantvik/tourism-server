const Review = require("../model/reviewModel");
// const APIFeatures = require('../utils/apiFeatures');
// const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const httpStatus = require("http-status");
const Factory = require("./handleFactory");

exports.setTourAndUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.params.id;
  next();
};

exports.deleteReview = Factory.deleteOne(Review);
exports.updateReview = Factory.updateOne(Review);
exports.createReview = Factory.createOne(Review);
exports.getReview = Factory.getOne(Review);
exports.getAllReviews = Factory.getAll(Review);
