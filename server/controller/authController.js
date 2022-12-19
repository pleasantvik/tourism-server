const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const httpStatus = require("http-status");
const sendEmail = require("../utils/email");
// const Email = require("../utils/email");

//REUSABLE FUNCTION TO CREATE TOKEN
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
};

const createSendToken = (user, statusCode, res) => {
  //CREATING TOKEN
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  user.password = undefined;
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    confirmPassword,
    role,
  });

  // const myProtocol = `${req.protocol}://${req.get("host")}`;

  // await new Email(newUser, myProtocol).sendWelcome(
  //   newUser,
  //   myProtocol,
  //   myProtocol
  // );

  createSendToken(newUser, httpStatus.CREATED, res);
});

//SIGN USER IN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1. check if user email and password exist
  if (!email || !password) {
    return next(
      new AppError("Please provide email and password", httpStatus.UNAUTHORIZED)
    );
  }

  //2. Check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password, user.password))) {
    return next(
      new AppError("Incorrect email or password", httpStatus.UNAUTHORIZED)
    );
  }

  //3. Send token

  // res.cookie("jwt", token);

  createSendToken(user, httpStatus.OK, res);
});

// PROTECT ROUTE
exports.protect = catchAsync(async (req, res, next) => {
  //1. Get token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    // console.log(token);
  }

  //CHECK IF TOKEN EXIST
  if (!token) {
    return next(
      new AppError(
        "You are not login. Please login to view this page",
        httpStatus.UNAUTHORIZED
      )
    );
  }
  //2. Verify the token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3. Check if user exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user with this token no longer exist",
        httpStatus.UNAUTHORIZED
      )
    );

  //4. Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError(
        "User recently changed password! Please login again.",
        httpStatus.UNAUTHORIZED
      )
    );

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //role include ['admin']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          httpStatus.FORBIDDEN
        )
      );
    }
    next();
  };
};

// FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user base on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(
      new AppError("User with this email does not exist", httpStatus.NOT_FOUND)
    );

  //2. Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3. Send it back as email

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  // const myProtocol = `${req.protocol}://${req.get("host")}`;
  const message = `Forgot your password? Submit a request with your new password and confirmPassword to ${resetURL}.\If you did'nt initiate this request, please kindly ignore the email`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token (Valid for 10mins)`,
      message,
    });

    // await new Email(user, resetURL).send(user, resetURL, myProtocol);

    res.status(200).json({
      status: "success",
      message: `Token sent to email`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an errro sending email, try again", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user base on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user)
    return next(
      new AppError("Token is invalid or has expired"),
      httpStatus.BAD_REQUEST
    );
  //2. If token has not expired and there is user, set the new password

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();
  //3.Update changePassword token
  //4. Log the user in and send JWT

  createSendToken(user, httpStatus.OK, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //2. Check if posted password is same as that in DB
  if (!(await user.matchPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Old password is not correct", 400));
  }

  //3.if 2 checkout update user

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;

  await user.save();

  createSendToken(user, httpStatus.OK, res);
});
