const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db-connection.js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
dotenv.config(); // populate environment variables
const PORT = process.env.PORT || 3001;


const app = express();
app.use((req, res, next) => { // in prod always use HTTPS
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === "production") {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
  } else {
    next();
  }
});
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build'))); // serve static files from frontend

/**
 * Check headers for JWT. If present, verify that JWT is vaild. If it is,
 * add the decoded payload to the req object so that we can access it in 
 * later middleware.
 */
function checkJwt(req, res, next) {
  if (!req.headers || !req.headers.authorization) {
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
      return res.status(401).json({error: 'Failed to authenticate token'});
    } else {
      req.jwtPayload = decoded;
      next();
    }
  });
};

/**
 * Send password reset email.
 * Generate a UUID to use as password reset token, then send email.
 */
app.post('/api/requestPasswordReset', async (req, res) => {
  try {
    const userQuery = await pool.query('SELECT * FROM account WHERE email = $1', [req.body.email]);
    if (!userQuery.rows.length) {
      return res.status(400).json({error: 'No account with this email.'});
    }

    const pwResetToken = uuidv4(); // generate a UUID to use as password reset token
    await pool.query('UPDATE account SET pw_reset_token = $1 WHERE email = $2', [pwResetToken, req.body.email]);
    await sgMail.send({
      'to': req.body.email,
      'from': 'aqimebaby@aqimebaby.com',
      'subject': `Reset your AQI Me Baby password`,
      'text':  `Visit here to reset your password: https://www.aqimebaby.com?pwResetToken=${pwResetToken}\n\nLove,\nAQI Me Baby\n\nP.S. If you didn't request a password reset, you can ignore this email.`,
      'html': `<p>Click <a href="https://www.aqimebaby.com?pwResetToken=${pwResetToken}">here</a> to reset your password.</p><p>Love,<br>AQI Me Baby</p>
      <img src="https://i.imgur.com/Inz6kz1.png" style="max-width:70px;" alt="happy cloud" />
      <br><br><p>P.S. If you didn't request a password reset, you can ignore this email.</p>
      `
    });
    res.status(200).send('Password reset email sent.');
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'An error occurred in password reset request.'});
  }
});

/**
 * Reset password in database.
 * Validate that password reset token is valid and new password is valid. If so, salt and
 * hash new password and update in database.
 */
app.post('/api/resetPassword', async (req, res) => {
  try {
    if (req.body.newPw === '') {
      return res.status(400).json({error: 'Password cannot be empty'});
    }
    if (!req.body.pwResetToken) {
      return res.status(400).json({error: 'Reset Password Token is missing'});
    }
    
    const userQuery = await pool.query('SELECT * FROM account WHERE pw_reset_token = $1', [req.body.pwResetToken]);
    if (!userQuery.rows.length) {
      return res.status(400).json({error: 'Invalid token, does not match any account'});
    }

    const salt = await bcrypt.genSalt(10);
    const saltedHashedPw = await bcrypt.hash(req.body.newPw, salt);
    await pool.query('UPDATE account SET pw = $1, pw_reset_token = NULL WHERE id = $2', [saltedHashedPw, userQuery.rows[0].id]);
    res.status(200).json({message: 'Password updated successfully.'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'An error occurred while resetting the password.'});
  }
});

/**
 * Route to confirm email.
 * Check supplied token against database. If it matches, mark the email confirmed.
 * Send back error or success message accordingly.
 */
app.get('/api/confirmEmail', async (req, res) => {
  try {
    const query = await pool.query('SELECT * FROM account WHERE email_verification_token = $1', [req.query.token]);
    if (!query.rows.length) {
      res.send('<h2 style="margin:20px;">Invalid verification token</h2>');
    } else {
      await pool.query('UPDATE account SET confirmed_email = true WHERE email_verification_token = $1', [req.query.token]);
      res.send('<h2 style="margin:20px;">Email confirmed!</h2>');
    }
  } catch (err) {
    console.log(err);
  }
});

/**
 * Sometimes the frontend just needs to know if a JWT is valid.
 */
app.get('/api/jwt', checkJwt, (req, res) => {
  // If we get to this point, the checkJwt middleware got to next() so the JWT was valid
  res.status(200).send();
});

/**
 * Retrieve user's alerts.
 */
app.get('/api/alerts', checkJwt, async (req, res) => {
  try {
    const alertQuery = await pool.query('SELECT * FROM alert WHERE account_id = $1', [req.jwtPayload.id]);
    res.json(alertQuery.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

/**
 * Create a new alert.
 */
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

    // don't allow creation of duplicate alerts
    const matchingAlertsQuery = await pool.query('SELECT * FROM alert WHERE account_id = $1 and location_name = $2 and alert_level = $3', [req.jwtPayload.id, req.body.location, req.body.aqi]);
    if (matchingAlertsQuery.rows.length > 0) {
      return res.status(400).json({error: 'An alert is already set for this location and AQI'});
    }

    await pool.query('INSERT INTO alert (account_id, alert_level, location_name, latitude, longitude) VALUES ($1, $2, $3, $4, $5)', [req.jwtPayload.id, req.body.aqi, req.body.location, req.body.lat, req.body.long]);
    return res.json({message: 'alert successfully created'});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred while creating new alert'});
  }
});

/**
 * Delete alert.
 */
app.delete('/api/alerts/:id', checkJwt, async (req, res) => {
  try {
    await pool.query('DELETE FROM alert WHERE account_id = $1 and id = $2', [req.jwtPayload.id, req.params.id]);
    return res.json({message: 'alert successfully deleted'});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred while deleting alert'});
  }
});

/**
 * Retrieve user's email address.
 */
app.get('/api/email', checkJwt, async (req, res) => {
  try {
    const emailQuery = await pool.query('SELECT * FROM account WHERE id = $1', [req.jwtPayload.id]);
    res.json({email: emailQuery.rows[0].email, confirmed_email: emailQuery.rows[0].confirmed_email});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

/**
 * Log into an existing account.
 * Check that email and password are valid. Then create and send back JWT.
 */
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
    return res.json({token: token});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

/**
 * Create a new account.
 * Check email and password are valid. Then salt and hash password, and enter new account into 
 * database. Also set JWT and send email verfication request email.
 */
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
    const newRowQuery = await pool.query('INSERT INTO account (email, pw) VALUES ($1, $2) RETURNING *', [req.body.email, saltedHashedPw]);

    // send email verification request
    try {
      await sgMail.send({
        'to': newRowQuery.rows[0].email,
        'from': 'aqimebaby@aqimebaby.com',
        'subject': `Verify your AQI Me Baby email address`,
        'text': `Visit here to verify your email:\nhttps://www.aqimebaby.com/api/confirmEmail?token=${newRowQuery.rows[0].email_verification_token}\n\nLove,\nAQI Me Baby\n\nP.S. If you didn't just create an AQI Me Baby account, you can ignore this email.`,
        'html': `<p>Click <a href="https://www.aqimebaby.com/api/confirmEmail?token=${newRowQuery.rows[0].email_verification_token}">here</a> to verify your email.</p><p>Love,<br>AQI Me Baby</p>
        <img src="https://i.imgur.com/Inz6kz1.png" style="max-width:70px;" alt="happy cloud" />
        <br><br><p>P.S. If you didn't just create an <strong>AQI Me Baby</strong> account, you can ignore this email.</p>
        `
      });
    } catch (err) {
      console.error('error sending verification email:', err);
    }

    // want users to be signed in after they create account, so create and send back JWT
    const token = jwt.sign({id: newRowQuery.rows[0].id}, 
                            process.env.JWT_SECRET, 
                            {expiresIn: '1y'});
    return res.json({token: token});

  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred'});
  }
});

/**
 * Delete user account.
 */
app.delete('/api/account', checkJwt, async (req, res) => {
  try {
    await pool.query('DELETE FROM account WHERE id = $1', [req.jwtPayload.id]);
    return res.json({message: 'account successfully deleted'});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error: 'an error occurred while deleting account'});
  }
});

app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
