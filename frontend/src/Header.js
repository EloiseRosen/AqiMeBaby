import React from 'react';
import cloudImage from './images/cloud.png'; 

const LoggedIn = false; // TODO  will be passed down as props later

function Header() {
  return (
    <header>

      {LoggedIn &&
      <div className='log-out-container'>
        <button className="transparent-button log-out"> {/* add onClick={onLogOut} */}
          Log Out
        </button>
      </div>
      }

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
