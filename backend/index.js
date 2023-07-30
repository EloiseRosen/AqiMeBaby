const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const pool = require('./db-connection.js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build'))); // serve static files from frontend


function checkJwt(req, res, next) {
  console.log('in checkJwt');
  if (!req.headers || !req.headers.authorization) {
    console.log('no token provided');
    return res.status(401).json({error: 'No token provided'});
  }

  /*
  * first arg is token we received that needs to be verified
  * second arg is secret
  * third arg is callback that is called once verification is done. If 
  there were an error during verification (e.g. JWT was tampered with),
  that will be in the first arg of the callback. Otherwise, the decoded
  JWT payload is in the second arg (`decoded`). Add the decoded payload to
  the req object so that we can access it in later middleware.
  */
  jwt.verify(req.headers.authorization, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Failed to authenticate token');
      return res.status(401).json({error: 'Failed to authenticate token'});
    } else {
      req.jwtPayload = decoded;
      console.log('req.jwtPayload is', req.jwtPayload);
      next();
    }
  });
};

// sometimes the frontend just needs to know if a JWT is valid
app.get('/api/jwt', checkJwt, (req, res) => {
  // If we get to this point, the checkJwt middleware got to next() so the JWT was valid
  res.status(200).send();
});

// for retrieving user's alerts
app.get('/api/alerts', checkJwt, async (req, res) => {
  try {
    const alertQuery = await pool.query('SELECT * FROM alert WHERE account_id = $1', [req.jwtPayload.id]);
    if (alertQuery.rows.length === 0) {
      console.log('no alerts set for this user');
    }
    res.json(alertQuery.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

// for retrieving user's email
app.get('/api/email', checkJwt, async (req, res) => {
  try {
    const emailQuery = await pool.query('SELECT * FROM account WHERE id = $1', [req.jwtPayload.id]);
    res.json({email: emailQuery.rows[0].email});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

/*
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
*/


// for logging in to an existing account
app.post('/api/login', async (req, res) => {
  try {
    const rowsWithMatchingEmail = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (rowsWithMatchingEmail.rows.length === 0) {
      return res.status(400).json({error: 'No account has this email'});
    }

    const isMatch = await bcrypt.compare(req.body.pw, rowsWithMatchingEmail.rows[0].pw);
    if (!isMatch) {
      return res.status(400).json({error: 'Invalid password'});
    }
    
    // create and send back JWT
    const token = jwt.sign({id: rowsWithMatchingEmail.rows[0].id}, 
                            process.env.JWT_SECRET, 
                            {expiresIn: '1y'});
    return res.json({token: token});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

// for creating a new account
app.post('/api/accounts', async (req, res) => {
  try {
    if (req.body.pw === '') {
      return res.status(400).json({error: 'Password cannot be empty'});
    }
    if (req.body.email === '') {
      return res.status(400).json({error: 'Email cannot be empty'});
    }
    const matchingEmailQuery = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (matchingEmailQuery.rows.length > 0) {
      return res.status(400).json({error: 'This email already has an account. Log in to continue.'});
    }
    const salt = await bcrypt.genSalt(10);
    const saltedHashedPw = await bcrypt.hash(req.body.pw, salt);
    await pool.query('INSERT INTO account (email, pw) VALUES ($1, $2)', [req.body.email, saltedHashedPw]);
    res.send();

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
