import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);

function Alerts() {
  const [alerts, setAlerts] = useState([]);

  async function fetchAlerts() {
    try {
      const response = await fetch(`${API_URL}/api/alerts`,
                                  {headers: {Authorization: localStorage.getItem('token')}}
      );
      console.log('the response from GET /api/alerts was', response);
      const responseBody = await response.json();
      console.log('the response body from the GET /api/alerts was', responseBody);
      if (responseBody.error) {
        console.error('Failed to fetch alerts:', responseBody.error);
        setAlerts([]);
      } else {
        setAlerts(responseBody);
      }

    } catch (err) {
      console.error('An error occurred while fetching alerts:', err);
      setAlerts([]);
    }
  }
  useEffect(() => {
    fetchAlerts();
  }, []);


  return (
    <div>
      <h2>Alerts</h2>
      {alerts.map((el, idx) => (
        <div key={idx}>
          <p>{el.location_name}</p>
          <p>{el.alert_level}</p>
        </div>
      ))}
    </div>
  );
}

export default Alerts;
