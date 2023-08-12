import React, { useState } from 'react';
import aqiChart from './images/aqi-chart.png';


/**
 * The InfoBox component displays information on what AQI levels correspond to what
 * risk levels.
 */
function InfoBox() {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  return (
    <>
      {infoIsOpen && 
      <div className="info-box">
        <button onClick={() => setInfoIsOpen(prev => !prev)} className="exit-info-button transparent-button">
          <i className="fa-solid fa-times"></i>
        </button>
        <h2 className="info-box-heading">AQI Levels</h2>
        <img src={aqiChart} className="aqi-chart" alt="US AQI chart"></img>
        <p className="info-box-text">Note: This scale is for the US.  Different countries use different numbering systems; for other countries see <a href="https://en.wikipedia.org/wiki/Air_quality_index#Indices_by_location" target="_blank" rel="noreferrer">here</a>.</p>
      </div>
      }
      <button className="transparent-button want-help" onClick={() => setInfoIsOpen(prev => !prev)}>
        Want help?
      </button>
    </>
  );
}

export default InfoBox;
