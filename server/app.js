const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const httpStatus = require("http-status");
const AppError = require("./utils/appError");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const globalErrorHandler = require("./controller/errorController");
const app = express();

const tourRouter = require("./route/tourRouter");
const userRouter = require("./route/userRouter");
const reviewRouter = require("./route/reviewRouter");

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// const limiter = rateLimit({
//   max: 100,
//   windowMS: 60 * 60 * 1000,
//   message: "Too many request, try again in 1 hour time",
// });
app.use(morgan("dev"));
app.use(mongoSanitize());
app.use(xss());

// app.use("/api", limiter);
app.use(express.json());
app.use(cookieParser());
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "price",
      "difficulty",
      "maxGroupSize",
    ],
  })
);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Unhandled Route
app.all("*", (req, res, next) => {
  // next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));

  next(
    new AppError(
      `Cant find ${req.originalUrl} on this server`,
      httpStatus.NOT_FOUND
    )
  );
});

//ERROR HANDLER MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
