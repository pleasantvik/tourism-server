const express = require("express");
const tourController = require("../controller/tourController");
const authController = require("../controller/authController");

const router = express.Router();
router.route("/tour-stats").get(tourController.getTourStat);
router.route("/monthly-plan/:year").get(
  // authController.protect,
  // authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan
);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTour, tourController.getAllTours);

router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),

    tourController.deleteTour
  );

module.exports = router;
