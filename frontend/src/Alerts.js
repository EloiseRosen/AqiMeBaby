import React, { useState, useEffect } from 'react';
import aqiChart from './images/aqi-chart.png'; 

const API_URL = process.env.REACT_APP_API_URL;


function Alerts(props) {
  const [alerts, setAlerts] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [aqiInput, setAqiInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchAlerts() {
    try {
      const response = await fetch(`${API_URL}/api/alerts`,
                                  {headers: {Authorization: localStorage.getItem('token')}}
      );
      console.log('the response from GET /api/alerts was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.handle401();
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

  async function handleCreateAlert() {
    try {
      const response = await fetch(`${API_URL}/api/alerts`, {
          method: 'POST', 
          headers: {'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token')},
          body: JSON.stringify({location: locationInput, aqi: aqiInput})
        }
      );
      console.log('the response from POST /api/alerts was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.handle401();
      }

      const responseBody = await response.json();
      console.log('the response body from the POST /api/alerts was', responseBody);
      if (responseBody.error) {
        setErrorMsg(responseBody.error);
      } else {
        setErrorMsg('');
      }
      fetchAlerts(); // need to get new alerts for display

    } catch (err) {
      setErrorMsg(err);
    }
  }


  return (
    <>
      <h2 className="overview-heading">Alerts</h2>
      <hr className="horizontal-line" />
      <p className="overview-text">You will receive one email when the AQI crosses above your threshold, and another when it crosses back below.</p>
      <table className="alerts-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>AQI Number</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((el, idx) => (
            <tr key={idx}>
              <td>{el.location_name}</td>
              <td>{el.alert_level}</td>
              <td>
                <button className="transparent-button table-button">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <input type="text" placeholder="Location" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
            </td>
            <td>
              <input type="text" placeholder="AQI Number" value={aqiInput} onChange={(e) => setAqiInput(e.target.value)} />
            </td>
            <td>
              <button className="transparent-button table-button" onClick={handleCreateAlert}>
                <i className="fa-solid fa-plus"></i>
              </button>
            </td>
          </tr>
          <tr className="help-row">
            <td></td>
            <td>
              <button type="button" className="transparent-button need-help">
                Need help?
              </button>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p className="error-msg alert">{errorMsg}</p>
      {false &&
        <img src={aqiChart} className="aqi-chart" alt="US AQI chart"></img>
      }
    </>
  );
}

export default Alerts;
