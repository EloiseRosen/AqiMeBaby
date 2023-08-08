console.log('running sendEmails.js');

const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail');
const pool = require('../backend/db-connection.js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('process.env.SENDGRID_API_KEY', process.env.SENDGRID_API_KEY);
console.log('process.env.AQI_API_TOKEN', process.env.AQI_API_TOKEN);


async function sendEmails() {
  try {
    console.log('inside try');
    const alertQuery = await pool.query('SELECT alert.location_name, alert.latitude, alert.longitude, alert.alert_level, alert.alert_active_last_check, account.email FROM alert inner join account on alert.account_id = account.id');
    console.log('alertQuery.rows.length', alertQuery.rows.length);
    for (const alertRow of alertQuery.rows) {
      console.log('alertRow', alertRow);
      const response = await fetch(`https://api.waqi.info/feed/geo:${alertRow.latitude};${alertRow.longitude}/?token=${process.env.AQI_API_TOKEN}`);
      const responseBody = await response.json();
      console.log('AQI API responseBody', responseBody)
      if (responseBody.status === "ok" && responseBody.data.aqi > alertRow.alert_level) {
        try {
          await sgMail.send({
            'to': alertRow.email,
            'from': 'aqimebaby@aqimebaby.com',
            'subject': `AQI in ${alertRow.location_name} has crossed above your threshold`,
            'text': `The AQI in ${alertRow.location_name} has crossed above your threshold of ${alertRow.alert_level}. It is now ${responseBody.data.aqi}. You will receive another email when it crosses back below.\n\nLove,\nAQI Me Baby\n\nIf you'd like to help cover the cost of these alerts, you can donate at https://www.buymeacoffee.com/eloiserosen.`,
            'html': `<p>The AQI in <strong>${alertRow.location_name}</strong> has crossed above your threshold of <strong>${alertRow.alert_level}</strong>. It is now <strong>${responseBody.data.aqi}</strong>. You will receive another email when it crosses back below.</p><br><p>Love,<br>AQI Me Baby</p>
            <img src="https://i.imgur.com/Inz6kz1.png" style="max-width:70px;" alt="happy cloud" />
            <br><p>If you'd like to help cover the cost of these alerts, you can donate <a href="https://www.buymeacoffee.com/eloiserosen">here</a>.</p>
            `
          });
          console.log('email sent');
        } catch (err) {
          console.error('error sending email:', err);
        }
      }
    }
  } catch (err) {
    console.error('error:', err);
  }
}
sendEmails();
