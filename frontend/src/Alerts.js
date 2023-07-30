import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);

function Alerts(props) {
  const [alerts, setAlerts] = useState([]);

  async function fetchAlerts() {
    try {
      const response = await fetch(`${API_URL}/api/alerts`,
                                  {headers: {Authorization: localStorage.getItem('token')}}
      );
      console.log('the response from GET /api/alerts was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        console.log('got back a 401, should be logged out');
        props.setIsLoggedIn(false);
      }

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
