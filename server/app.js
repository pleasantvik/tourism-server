const express = require("express");

const app = express();

app.get("/", (req, res, next) =>
  res.status(200).json({ status: "success", data: "Welcome to tourism app" })
);
const port = process.env.PORT || 8000;

app.listen(port, console.log(`Server is running on port ${port}`));
