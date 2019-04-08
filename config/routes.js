const axios = require("axios");
const db = require("../database/dbConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

async function register(req, res) {
  let { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ msg: "Bad request" });
  }

  password = bcrypt.hashSync(password, 8);

  try {
    const user = await db("users").insert({ username, password });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
}

async function login(req, res) {
  // implement user login
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ msg: "Bad request" });
  }

  try {
    const user = await db("users")
      .where({ username })
      .first();

    console.log(user.password);

    if (bcrypt.compareSync(password, user.password)) {
      const token = generateToken(user);

      res.status(200).json({ user, token });
    } else {
      res.status(403).json({ msg: "Unauthorized" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}

function generateToken({ id, username }) {
  const payload = {
    subject: id,
    username
  };

  const jwtKey =
    process.env.JWT_SECRET ||
    "add a .env file to root of project with the JWT_SECRET variable";

  const secret = jwtKey;

  const options = {
    expiresIn: "1d"
  };

  return jwt.sign(payload, secret, options);
}
