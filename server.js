const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3005; // You can change this port if needed

// Middleware setup
app.use(bodyParser.json());
app.use(cors()); // Allow all origins for now, can be adjusted for security later

// Create a pool of connections to MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',     // Replace with your MySQL email
  password: '', // Replace with your MySQL password
  database: 'pfc_user', // Replace with your MySQL database name
});

// Test MySQL connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
  connection.release(); // Release the connection back to the pool
});

// Basic GET route for testing
app.get('/', (req, res) => {
  res.send('Hello, this is the backend server!');
});

// Example POST route to handle user registration (for example)
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  
  // Simple query to insert data into a users table (make sure the table exists)
  pool.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error inserting data:', err.stack);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ message: 'User registered successfully', userId: results.insertId });
    }
  );
});

// Example POST route to handle login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Query to check if user exists with the provided email and password
  pool.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error fetching data:', err.stack);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length > 0) {
        res.status(200).json({ message: 'Login successful', user: results[0] });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
