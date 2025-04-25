const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../data/dbConfig");
const {
  checkBodyParams,
  checkUniqueUsername,
  checkCredentials,
} = require("./auth-middleware.js");

router.post(
  "/register",
  checkBodyParams,
  checkUniqueUsername,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const hash = bcrypt.hashSync(password, 8);

      const [id] = await db("users").insert({ username, password: hash });

      const newUser = await db("users").where({ id }).first();

      res.status(201).json(newUser);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error registering user", error: error.message });
    }
  }
);

router.post("/login", checkBodyParams, checkCredentials, async (req, res) => {
  try {
    const { username } = req.body;
    const user = await db("users").where({ username }).first();
    const token = generateToken(user);

    res.status(200).json({
      message: `welcome, ${user.username}`,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
  };

  const options = {
    expiresIn: "30m",
  };

  const jwtSecret = process.env.JWT_SECRET || "keep it secret, keep it safe!";

  return jwt.sign(payload, jwtSecret, options);
}

module.exports = router;
