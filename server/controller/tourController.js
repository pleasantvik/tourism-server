const fs = require("fs");
const httpStatus = require("http-status");
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.getAllTours = (req, res, next) =>
  res.status(200).json({
    status: "success",
    results: tours.length,
    requestedAt: req.requestTime,
    data: {
      tours,
    },
  });

exports.createTour = (req, res, next) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  console.log(req.body);

  res.send("Hello");
};

exports.getTour = (req, res) => {
  const id = `${req.params.id}` * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "Not found, invalid",
    });
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
};

exports.updateTour = (req, res) => {
  const id = `${req.params.id}` * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "Not found, invalid",
    });
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
};
exports.deleteTour = (req, res) => {
  const id = `${req.params.id}` * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "Not found, invalid",
    });
  }

  res.status(httpStatus.NO_CONTENT).json({
    status: "success",
    data: null,
  });
};
