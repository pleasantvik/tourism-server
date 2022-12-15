const fs = require("fs");
const express = require("express");
const httpStatus = require("http-status");
const morgan = require("morgan");
const app = express();

const tourRouter = require("./route/tourRouter");
const userRouter = require("./route/userRouter");

// const tours = fs.readFileSync(`./dev-data/data/tours-simple.json`);
app.use(morgan("dev"));
app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log("Hello");
  next();
});

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 8000;

app.listen(port, console.log(`Server is running on port ${port}`));
