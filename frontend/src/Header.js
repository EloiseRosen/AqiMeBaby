import React from 'react';
import cloudImage from './images/cloud.png'; 


function Header() {
  return (
    <header>
      <div className="title-container">
        <img src={cloudImage} className="title-cloud" alt="happy cloud"></img>
        <h1 className="title">AQI ME BABY</h1>
        <img src={cloudImage} className="title-cloud" alt="happy cloud"></img>
      </div>

      <div className="subtitle-container">
        <h2 className="subtitle">custom <a href="https://en.wikipedia.org/wiki/Air_quality_index" target="_blank" rel="noreferrer" id="wiki-link">AQI</a> alerts by location and AQI level</h2>
      </div>

    </header>
  );
}

export default Header;
