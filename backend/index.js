const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const pool = require('./db-connection.js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({origin: process.env.CLIENT_URL, credentials: true, optionsSuccessStatus: 200}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build'))); // serve static files from frontend


function checkJwt(req, res, next) {
  console.log('in checkJwt');

	// Get the JWT from the cookies
  const token = req.cookies.token;

  if (!token) {
    console.log('no token in cookies');
    return res.status(401).json({error: 'no token in cookies'});
  }

  /*
  First arg is token we received that needs to be verified.
  Third arg is callback that is called once verification is done. If 
  there were an error during verification (e.g. JWT was tampered with),
  that will be in the first arg of the callback. Otherwise, the decoded
  JWT payload is in the second arg (`decoded`). Add the decoded payload to
  the req object so that we can access it in later middleware.
  */
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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

// create new alert
app.post('/api/alerts', checkJwt, async (req, res) => {
  try {
    if (req.body.location === '' || req.body.aqi === '') {
      return res.status(400).json({error: 'Fields cannot be empty'});
    }
    if (isNaN(Number(req.body.aqi))) {
      return res.status(400).json({error: 'AQI must be a number'});
    }
    if (Number(req.body.aqi) < 1 || Number(req.body.aqi) > 500) {
      return res.status(400).json({error: 'AQI must be between 1 and 500 (inclusive)'});
    }

    // TODO don't let user create an alert that already exists
    //const matchingEmailQuery = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    //if (matchingEmailQuery.rows.length > 0) {
    //  return res.status(400).json({error: 'This email already has an account. Log in to continue.'});
    //}

    // TODO update lat and long when implemented
    await pool.query('INSERT INTO alert (account_id, alert_level, location_name, latitude, longitude) VALUES ($1, $2, $3, $4, $5)', [req.jwtPayload.id, req.body.aqi, req.body.location, 37.7749, -122.4194]);
    return res.json({message: 'alert successfully created'});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred while creating new alert'});
  }
});

// delete alert
app.delete('/api/alerts/:id', checkJwt, async (req, res) => {
  try {
    await pool.query('DELETE FROM alert WHERE account_id = $1 and id = $2', [req.jwtPayload.id, req.params.id]);
    return res.json({message: 'alert successfully deleted'});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred while deleting alert'});
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
    const matchingEmailQuery = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (matchingEmailQuery.rows.length === 0) {
      return res.status(400).json({error: 'No account has this email'});
    }

    const isMatch = await bcrypt.compare(req.body.pw, matchingEmailQuery.rows[0].pw);
    if (!isMatch) {
      return res.status(400).json({error: 'Invalid password'});
    }
    
    // create and send back JWT
    const token = jwt.sign({id: matchingEmailQuery.rows[0].id}, 
                            process.env.JWT_SECRET, 
                            {expiresIn: '1y'});
    /*
    Instead of storing the JWT in localStorage (which is vulnerable to Cross-Site Scripting attacks), better to store
    the JWT in HttpOnly cookie. (Setting httpOnly: true on the cookie makes it inaccessible to JavaScript running in 
    the browser.)
    res.cookie(..) sets a cookie on our HTTP response. When the frontend receives any HTTP response with a cookie, it 
    automatically gets set on the browser, so no need to do a cookie-equivalent of localStorage.setItem('token', jwt).
    And the browser will automatically include cookies on any subsequent HTTP requests.
    */
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // use https in production
      // if there is no maxAge or Expires it's a session cookie (i.e. cookie will be deleted when browser is closed,
      // so user gets logged out). I'm setting the maxAge to be the same as the JWT expiration.
      maxAge: 60 * 60 * 24 * 365 * 1000
    });
    return res.json({message: 'authentication successful'});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.send();
});

// for creating a new account
app.post('/api/account', async (req, res) => {
  try {
    if (req.body.email === '') {
      return res.status(400).json({error: 'Email cannot be empty'});
    }
    if (req.body.pw === '') {
      return res.status(400).json({error: 'Password cannot be empty'});
    }
    const matchingEmailQuery = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (matchingEmailQuery.rows.length > 0) {
      return res.status(400).json({error: 'This email already has an account. Log in to continue.'});
    }
    const salt = await bcrypt.genSalt(10);
    const saltedHashedPw = await bcrypt.hash(req.body.pw, salt);
    const idQuery = await pool.query('INSERT INTO account (email, pw) VALUES ($1, $2) RETURNING *', [req.body.email, saltedHashedPw]);

    // want users to be signed in after they create account, so create and send back JWT
    const token = jwt.sign({id: idQuery.rows[0].id}, 
                            process.env.JWT_SECRET, 
                            {expiresIn: '1y'});
    return res.json({token: token});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
