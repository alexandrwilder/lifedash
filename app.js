const express = require("express");
const mysql = require("mysql");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require('express-session');

const app = express();

// Replace with your MySQL credentials
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "alexander_growhouse",
  password: "i%b2kQexAX&VeHf4!UWM$iXKZ$*X",
  database: "lifeboard",
});

db.connect((err) => {
  if (err) {
    throw err;
  } 
  console.log("MySQL connected...");
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
app.use(session({
  secret: "my-secret",
  resave: false,
  saveUninitialized: true,
}));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Define middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user || req.headers.authorization) {
    // If the user is authenticated, allow the request to proceed
    next();
  } else {
    // If the user is not authenticated, redirect to the login page
    res.redirect('/login');
  }
};

// Serve dashboard.html only to authenticated users
// Define the /dashboard route
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Define the /saveUrls API endpoint
app.post('/saveUrls', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { jsonUrl, defaultSelection } = req.body;

  // First, remove any existing URLs for this user
  const deleteQuery = "DELETE FROM user_urls WHERE userID = ?";
  db.query(deleteQuery, [userId], (err) => {
    if (err) {
      console.error('Error during URL deletion:', err);
      res.status(500).json({ error: "Failed to save URLs" });
      return;
    }

    // Insert the new JSON URL into the user_urls table
    const insertQuery = "INSERT INTO user_urls (userID, json_url) VALUES (?, ?)";
    db.query(insertQuery, [userId, jsonUrl], (err) => {
      if (err) {
        console.error('Error during URL insertion:', err);
        res.status(500).json({ error: "Failed to save URLs" });
      } else {
        // Update the user's default selection in the user_settings table
        const updateQuery = "INSERT INTO user_settings (userID, setting_name, setting_value) VALUES (?, 'default_selection', ?) ON DUPLICATE KEY UPDATE setting_value = ?";
        db.query(updateQuery, [userId, defaultSelection, defaultSelection], (err) => {
          if (err) {
            console.error('Error during default selection update:', err);
            res.status(500).json({ error: "Failed to save default selection" });
          } else {
            res.status(200).json({ message: "JSON URL and default selection saved successfully" });
          }
        });
      }
    });
  });
});




// Define the /logout API endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ error: "Failed to logout" });
    } else {
      res.status(200).json({ message: "Successfully logged out" });
    }
  });
});


// Start the server
app.listen(3001, () => {
  console.log('Server started on port 3001');
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
        // Set a session variable to indicate that the user is logged in
        req.session.user = user;

        // Redirect to dashboard after successful login
        res.redirect("/dashboard");
      } else {
        // Handle error, e.g., return an error message
        res.status(401).json({ error: "Invalid username or password" });
      }
    }
  });
});






const PORT = process.env.PORT || 80;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
