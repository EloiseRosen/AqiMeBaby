import React from 'react';
import cloudImage from './images/cloud.png'; 


function Header(props) {
  const headerStyle = {
    marginTop: !props.isLoggedIn ? '30px' : '20px',
    marginBottom: !props.isLoggedIn ? '100px' : '60px'
  };

  const cloudStyle = {
    maxHeight: !props.isLoggedIn ? '100px' : '77px'
  };

  const titleStyle = {
    fontSize: !props.isLoggedIn ? '85px' : '65px'
  };

  return (
    <header style={headerStyle}>
      <div className="title-container">
        <img src={cloudImage} style={cloudStyle} alt="happy cloud"></img>
        <h1 className="title" style={titleStyle}>AQI ME BABY</h1>
        <img src={cloudImage} style={cloudStyle} alt="happy cloud"></img>
      </div>
      
      {!props.isLoggedIn &&
      <div className="subtitle-container">
        <h2 className="subtitle">custom <a href="https://en.wikipedia.org/wiki/Air_quality_index" target="_blank" rel="noreferrer" id="wiki-link">AQI</a> alerts by location and AQI level</h2>
      </div>}

    </header>
  );
}

export default Header;
