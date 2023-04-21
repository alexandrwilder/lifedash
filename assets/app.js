const express = require("express");
const mysql = require("mysql");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();

// Replace with your MySQL credentials
const db = mysql.createConnection({
  host: "localhost",
  user: "your_mysql_user",
  password: "your_mysql_password",
  database: "your_mysql_database",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MySQL connected...");
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// User registration endpoint
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Validate input and handle errors

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert the user into the database
  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(query, [username, hashedPassword], (err, result) => {
    if (err) {
      // Handle error, e.g., return an error message
      res.status(500).json({ error: "Failed to register user" });
    } else {
      // Return a success message or user data
      res.status(201).json({ message: "User registered successfully" });
    }
  });
});

// User login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate input and handle errors

  // Fetch the user from the database
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, result) => {
    if (err || result.length === 0) {
      // Handle error, e.g., return an error message
      res.status(401).json({ error: "Invalid username or password" });
    } else {
      const user = result[0];

      // Compare the hashed password in the database with the provided password
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Handle successful login, e.g., create a session or send user data
        res.status(200).json({ message: "Logged in successfully" });
      } else {
        // Handle error, e.g., return an error message
        res.status(401).json({ error: "Invalid username or password" });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
