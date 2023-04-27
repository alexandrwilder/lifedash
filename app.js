const express = require("express");
const mysql = require("mysql");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require('express-session');
require("dotenv").config();

const app = express();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MySQL connected...");
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const isAuthenticated = (req, res, next) => {
  if (req.session.user || req.headers.authorization) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Define the /saveUrls API endpoint
app.post('/saveUrls', isAuthenticated, (req, res) => {
  const urls = req.body.urls;
  const userId = req.session.user.id; // add this line to extract userId from the session
  const type = req.body.type;
  const description = req.body.description;
  if (!userId) {
    res.status(401).send('Unauthorized');
    return;
  }
  const query = 'INSERT INTO user_urls (user_id, url, description, type) VALUES (?, ?, ?, ?)';
  const values = urls.map(url => [userId, url, description, type]);
  db.query(query, [values], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error saving URLs');
      return;
    }
    res.sendStatus(200);
  });
});


app.post('/saveJsonUrl', isAuthenticated, (req, res) => {
  const userId = req.session.user.id; // extract userId from the session
  const jsonUrl = req.body.jsonUrl;
  const defaultSelection = req.body.defaultSelection;

  // First, remove any existing URLs for this user
  const deleteQuery = "DELETE FROM user_urls WHERE user_id = ?";
  db.query(deleteQuery, [userId], (err) => {
    if (err) {
      console.error('Error during URL deletion:', err);
      res.status(500).json({ error: "Failed to save URLs" });
      return;
    }

    // Insert the new JSON URL into the user_urls table
    const insertQuery = "INSERT INTO user_urls (user_id, json_url) VALUES (?, ?)";
    db.query(insertQuery, [userId, jsonUrl], (err) => {
      if (err) {
        console.error('Error during URL insertion:', err);
        res.status(500).json({ error: "Failed to save URLs" });
      } else {
        // Update the user's default selection in the user_settings table
        const updateQuery = "INSERT INTO user_settings (user_id, setting_name, setting_value) VALUES (?, 'default_selection', ?) ON DUPLICATE KEY UPDATE setting_value = ?";
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

  // First, remove any existing URLs for this user
  // First, remove any existing URLs for this user
const deleteQuery = "DELETE FROM user_urls WHERE user_id = ?";
db.query(deleteQuery, [userId], (err) => {
  if (err) {
    console.error('Error during URL deletion:', err);
    res.status(500).json({ error: "Failed to save URLs" });
    return;
  }

  // Insert the new JSON URL into the user_urls table
  const insertQuery = "INSERT INTO user_urls (user_id, json_url) VALUES (?, ?)";
  db.query(insertQuery, [userId, jsonUrl], (err) => {
    if (err) {
      console.error('Error during URL insertion:', err);
      res.status(500).json({ error: "Failed to save URLs" });
    } else {
      // Update the user's default selection in the user_settings table
      const updateQuery = "INSERT INTO user_settings (user_id, setting_name, setting_value) VALUES (?, 'default_selection', ?) ON DUPLICATE KEY UPDATE setting_value = ?";
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
