const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');  // Import the CORS middleware

const app = express();
const port = process.env.PORT || 3000;  // Use Render's dynamic port or fallback to 3000

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());

// PostgreSQL configuration (using Render's DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Render provides DATABASE_URL environment variable
  ssl: {
    rejectUnauthorized: false,  // Necessary for connecting to a remote PostgreSQL database with SSL
  },
});

// Routes


app.get('/', (req, res) => {
  return(res.status(200).json({ message: 'Hello, World!' }));
});

// Register endpoint
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Insert the new user
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
    return res.status(201).json({ message: 'Registration successful.' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email and password match
    const user = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.status(200).json({ message: 'Login successful.' });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  const { email } = req.body;

  try {
    return res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
