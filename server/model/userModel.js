const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "A user must have an email"],
    validate: [validator.isEmail, "A user must have a valid email"],
    unique: true,
    lowerCase: true,
    trim: true,
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["admin", "guide", "lead-guide", "user"],
    default: "user",
  },
  password: {
    type: String,
    minlength: [8, "Password should have minimum of 8 character"],
    required: [true, "Password field is required"],
    trim: true,
    select: false,
  },
  confirmPassword: {
    type: String,
    trim: true,
    required: [true, "Please confirm your password"],
    validate: {
      //This works only on create and update
      validator: function (value) {
        return value === this.password;
      },
      message: "Password does not match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});
userSchema.methods.matchPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passwordChangeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(passwordChangeTimestamp, JWTTimeStamp);
    return JWTTimeStamp < passwordChangeTimestamp; // if this is true, it means user changed password
  }

  // If we return false it means the password didnt change
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // console.log({
  //   resetToken,
  //   encryptVersion: this.passwordResetToken,
  //   expire: this.passwordResetExpires
  // });

  return resetToken;
};

//QUERY MIDDLEWARE TO HIDE A DOCUMENT
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;
