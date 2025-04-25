const db = require("../../data/dbConfig");
const bcrypt = require("bcrypt");

function checkBodyParams(req, res, next) {
  if (!req.body.username || !req.body.password) {
    console.log("username or password missing");
    return res.status(400).json({ message: "username and password required" });
  }
  console.log("username and password provided");
  next();
}

async function checkUniqueUsername(req, res, next) {
  try {
    const username = req.body.username;
    const user = await db("users").where({ username }).first();

    if (user) {
      console.log("username is taken");
      return res.status(400).json({ message: "username taken" });
    }

    console.log("username is not taken");
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error checking username", error: error.message });
  }
}

async function checkCredentials(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await db("users").where({ username }).first();

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    req.user = user;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error checking credentials", error: error.message });
  }
}

module.exports = {
  checkBodyParams,
  checkUniqueUsername,
  checkCredentials,
};
