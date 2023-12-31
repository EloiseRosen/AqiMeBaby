import React, { useState, useEffect, useRef } from 'react';
import InfoBox from './InfoBox';

const URL = process.env.REACT_APP_URL;


/**
 * The Alerts component displays alert information and provides functionality
 * for alert management actions (create new alert, delete alert).
 */
function Alerts(props) {
  const [alerts, setAlerts] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [aqiInput, setAqiInput] = useState('');
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);
  // don't allow alert creation unless autocompleted place with lat and long has been selected
  const [autocompletedPlaceSelected, setAutocompletedPlaceSelected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * Location autocomplete functionality.
   * 
   * locationInputRef refers to location input field (see ref={locationInputRef} below).
   * locationInputRef.current then points to the actual DOM element of the input field once it is rendered.
   * This is then used in new window.google.maps.places.Autocomplete(locationInputRef.current) to initialize
   * the Google Places API autocomplete feature.
   * useRef avoids unnecessary re-renders of component.
   */
  const locationInputRef = useRef(null);
  useEffect(() => {
    window.initAutocomplete = () => {
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          setLat(place.geometry.location.lat());
          setLong(place.geometry.location.lng());
          setLocationInput(place.formatted_address || place.name);
          setAutocompletedPlaceSelected(true);
          setErrorMsg('');
        } else {
          setAutocompletedPlaceSelected(false);
          setErrorMsg('Invalid location: does not have populated latitude and longitude');
        }
      });
    }
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDpjudUTMuqEypYNUkbT5GWIEVBQnV_u78&libraries=places&callback=initAutocomplete';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  /**
   * Fetch the alerts associated with this account.
   */
  async function fetchAlerts() {
    try {
      const response = await fetch(`${URL}/api/alerts`,
                                  {headers: {Authorization: localStorage.getItem('token')}}
      );

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
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

  /**
   * When user enters new alert info and clicks to create the new alert, check that input is valid.
   * If it is, send POST request to backend to create the new alert. Then refresh the alerts view to
   * display the updated list of alerts.
   */
  async function handleCreateAlert() {
    if (!autocompletedPlaceSelected) {
      setErrorMsg('Please select a location from dropdown');
      return;
    }
    try {
      const response = await fetch(`${URL}/api/alerts`, {
          method: 'POST', 
          headers: {'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token')},
          body: JSON.stringify({location: locationInput, aqi: aqiInput, lat: lat, long: long})
        }
      );
      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
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

  /**
   * When user clicks to delete an alert, send the DELETE HTTP request. 
   * Refresh the alerts view to display the updated list of alerts.
   */
  async function handleDeleteAlert(id) {
    try {
      const response = await fetch(`${URL}/api/alerts/${id}`, {
          method: 'DELETE', 
          headers: {'Authorization': localStorage.getItem('token')}
        }
      );

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
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
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Location"
                value={locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value);
                  setAutocompletedPlaceSelected(false);
                }}
              />
            </td>
            <td>
              <input type="text" placeholder="AQI" value={aqiInput} onChange={(e) => setAqiInput(e.target.value)} />
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
