const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const pool = require('./db-connection.js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build'))); // serve static files from frontend

app.get('/api', (req, res) => {
    res.json({message: 'Hello from server!'});
});

app.get('/api/external', async (req, res) => {
    try {
      const response = await fetch(`https://api.waqi.info/feed/here/?token=${process.env.EXTERNAL_API_TOKEN}`);
      const json = await response.json();
      res.json(json);
    } catch (err) {
      console.error(err);
      res.status(500).json({error: 'An error occurred'});
    }
});
  


app.get('/api/accounts', async (req, res) => {
    try {
        const allAccounts = await pool.query('SELECT * FROM account');
        res.json(allAccounts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

app.post('/api/login', async (req, res) => {
  try {
    const rowsWithMatchingEmail = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (rowsWithMatchingEmail.rows.length > 0) {
      const isMatch = await bcrypt.compare(req.body.pw, rowsWithMatchingEmail.rows[0].pw);
      if (isMatch) {
        res.send();
      } else {
        res.status(400).json({error: 'Invalid password'});
      }
    } else {
      res.status(400).json({error: 'No account has this email'});
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    if (req.body.pw === '') {
      return res.status(400).json({error: 'Password cannot be empty'});
    }
    const rowsWithMatchingEmail = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (rowsWithMatchingEmail.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const saltedHashedPw = await bcrypt.hash(req.body.pw, salt);
      await pool.query('INSERT INTO account (email, pw) VALUES ($1, $2)', [req.body.email, saltedHashedPw]);
      res.send();
    } else {
      res.status(400).json({error: 'This email already has an account. Log in to continue.'});
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});
