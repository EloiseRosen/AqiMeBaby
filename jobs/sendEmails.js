const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail');
const pool = require('../backend/db-connection.js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


/**
 * Sleep for 65 milliseconds between requests. Then max # of AQI requests in a second
 * is 15.4, and max # of requests in a minute is 923.
 */
function sleep() {
  return new Promise(resolve => setTimeout(resolve, 65));
}

/**
 * Get alerts associated with accounts where confirmed_email is true. For each alert, send out 
 * email if the alert conditions have been met.
 * Sleep to stay within API limits.
 */
async function sendEmails() {
  try {
    const alertQuery = await pool.query('SELECT alert.id, alert.location_name, alert.latitude, alert.longitude, alert.alert_level, alert.alert_active_last_check, account.email FROM alert inner join account on alert.account_id = account.id where account.confirmed_email = true');
    for (const alertRow of alertQuery.rows) {
      const response = await fetch(`https://api.waqi.info/feed/geo:${alertRow.latitude};${alertRow.longitude}/?token=${process.env.AQI_API_TOKEN}`);
      await sleep();
      const responseBody = await response.json();

      // newly crossed above alert threshold
      if (responseBody.status === "ok" && responseBody.data.aqi > alertRow.alert_level && !alertRow.alert_active_last_check) {
        try {
          await sgMail.send({
            'to': alertRow.email,
            'from': 'aqimebaby@aqimebaby.com',
            'subject': `AQI in ${alertRow.location_name} has crossed above your threshold`,
            'text': `The AQI in ${alertRow.location_name} has crossed above your threshold of ${alertRow.alert_level}. It is now ${responseBody.data.aqi}. You will receive another email when it crosses back below.\n\nLove,\nAQI Me Baby\n\nIf you'd like to help cover the cost of these alerts, you can donate at buymeacoffee.com/eloiserosen`,
            'html': `<p>The AQI in <strong>${alertRow.location_name}</strong> has crossed above your threshold of <strong>${alertRow.alert_level}</strong>. It is now <strong>${responseBody.data.aqi}</strong>. You will receive another email when it crosses back below.</p><p>Love,<br>AQI Me Baby</p>
            <img src="https://i.imgur.com/Inz6kz1.png" style="max-width:70px;" alt="happy cloud" />
            <br><p style="color: gray;">If you'd like to help cover the cost of these alerts, you can donate <a href="https://www.buymeacoffee.com/eloiserosen">here</a>.</p>
            `
          });
          pool.query('UPDATE alert SET alert_active_last_check = TRUE WHERE id = $1', [alertRow.id]);
        } catch (err) {
          console.error('error with alert (crossed above):', err);
        }

      // new crossed below alert threshold
      } else if (responseBody.status === "ok" && responseBody.data.aqi < alertRow.alert_level  && alertRow.alert_active_last_check) {
        try {
          await sgMail.send({
            'to': alertRow.email,
            'from': 'aqimebaby@aqimebaby.com',
            'subject': `AQI in ${alertRow.location_name} has crossed back below your threshold`,
            'text': `The AQI in ${alertRow.location_name} has crossed back below your threshold of ${alertRow.alert_level}. It is now ${responseBody.data.aqi}.\n\nLove,\nAQI Me Baby\n\nIf you'd like to help cover the cost of these alerts, you can donate at buymeacoffee.com/eloiserosen`,
            'html': `<p>The AQI in <strong>${alertRow.location_name}</strong> has crossed back below your threshold of <strong>${alertRow.alert_level}</strong>. It is now <strong>${responseBody.data.aqi}</strong>.</p><p>Love,<br>AQI Me Baby</p>
            <img src="https://i.imgur.com/Inz6kz1.png" style="max-width:70px;" alt="happy cloud" />
            <br><p style="color: gray;">If you'd like to help cover the cost of these alerts, you can donate <a href="https://www.buymeacoffee.com/eloiserosen">here</a>.</p>
            `
          });
          pool.query('UPDATE alert SET alert_active_last_check = FALSE WHERE id = $1', [alertRow.id]);
        } catch (err) {
          console.error('error with alert (crossed below):', err);
        }
      }

    }
  } catch (err) {
    console.error('error:', err);
  }
}
sendEmails();
