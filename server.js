const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const crypto = require('crypto');

const app = express();
const port = 3005; 

app.use(bodyParser.json());
app.use(cors());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pfc_user',
});


pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
  connection.release();
});

function generateSessionKey() {
  return crypto.randomBytes(32).toString('hex'); 
}

// Basic GET route for testing
app.get('/', (req, res) => {
  res.send('Hello, this is the backend server!');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
      // Check if the username already exists
      pool.query(
          'SELECT * FROM users WHERE username = ?',
          [username],
          async (err, results) => {
              if (err) {
                  console.error('Error querying database:', err.stack);
                  return res.status(500).json({ error: 'Database error' });
              }

              if (results.length > 0) {
                  return res.status(400).json({ error: 'Username already exists' });
              }

              // If username does not exist, proceed with registration
              const saltRounds = 10;
              const hashedPassword = await bcrypt.hash(password, saltRounds);

              pool.query(
                  'INSERT INTO users (username, password) VALUES (?, ?)',
                  [username, hashedPassword],
                  (err, results) => {
                      if (err) {
                          console.error('Error inserting data:', err.stack);
                          return res.status(500).json({ error: 'Database error' });
                      }
                      res.status(200).json({ message: 'User registered successfully', userId: results.insertId });
                  }
              );
          }
      );
  } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  
  pool.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Error fetching data:', err.stack);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      const user = results[0];

      
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        
        const sessionKey = generateSessionKey();

        pool.query(
          'UPDATE users SET session_key = ? WHERE id = ?',
          [sessionKey, user.id],
          (updateErr) => {
            if (updateErr) {
              console.error('Error updating session key:', updateErr.stack);
              return res.status(500).json({ error: 'Database error' });
            }

            res.status(200).json({ message: 'Login successful', session_key: sessionKey, username: user.username});
          }
        );
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

app.post('/logout', async (req, res) => {
  const { username } = req.body;

  pool.query(
    'UPDATE users SET session_key = NULL WHERE username = ?',
    [username],
    (err, results) => {
      if (err) {
        console.error('Error during logout:', err.stack);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.affectedRows > 0) {
        res.status(200).json({ message: 'Logout successful' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    }
  );
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
