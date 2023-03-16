const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./mydb.sqlite', err => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Define a route handler for the home page
app.get('/', (req, res) => {
  // Query the database for all users
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      // Render the users as a list in the response
      const users = rows.map(row => `${row.id}: ${row.name}`).join('\n');
      res.send(`All users:\n${users}`);
    }
  });
});

// Define a route handler for a specific user
app.get('/users/:id', (req, res) => {
  const id = req.params.id;

  // Query the database for the user with the specified ID
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (row) {
      // Render the user information in the response
      res.send(`User ID: ${row.id}\nName: ${row.name}\nEmail: ${row.email}`);
    } else {
      // If no user is found, send a 404 Not Found error
      res.status(404).send('User not found');
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
