import React, { useState, useEffect } from 'react';
import InfoBox from './InfoBox';

const API_URL = process.env.REACT_APP_API_URL;


function Alerts(props) {
  const [alerts, setAlerts] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [aqiInput, setAqiInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchAlerts() {
    try {
      const response = await fetch(`${API_URL}/api/alerts`, {
        // headers: {Authorization: localStorage.getItem('token')}, // no longer storing JWT in local storage
        credentials: 'include', // makes cookies be included, which we need because our JWT is now stored in cookie
      });
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
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({location: locationInput, aqi: aqiInput}),
          credentials: 'include'
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
        setAqiInput('');
        setLocationInput('');
      }
      fetchAlerts(); // need to get new alerts for display

    } catch (err) {
      setErrorMsg(err);
    }
  }

  async function handleDeleteAlert(id) {
    try {
      const response = await fetch(`${API_URL}/api/alerts/${id}`, {
          method: 'DELETE', 
          // headers: {'Authorization': localStorage.getItem('token')},
          credentials: 'include'
        }
      );
      console.log('the response from DELETE /api/alerts/:id was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.handle401();
      }

      const responseBody = await response.json();
      console.log('the response body from the DELETE /api/alerts/:id was', responseBody);
      if (responseBody.error) {
        console.error(responseBody.error);
      }
      fetchAlerts(); // need to refresh displayed alerts

    } catch (err) {
      console.error(err);
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
          {alerts.map((el) => (
            <tr key={el.id}>
              <td>{el.location_name}</td>
              <td>{el.alert_level}</td>
              <td>
                <button className="transparent-button table-button" onClick={() => handleDeleteAlert(el.id)}>
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
              <InfoBox />
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p className="error-msg alert">{errorMsg}</p>
    </>
  );
}

export default Alerts;
