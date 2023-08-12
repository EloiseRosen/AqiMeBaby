import React from 'react';


/**
 * The Logout component provides log out functionality.
 */
function Logout(props) {
  return  (
  <div className='log-out-container'>
    <button className="transparent-button log-out" onClick={props.onLogout}>
      Log Out
    </button>
  </div>
  );
}

export default Logout;
