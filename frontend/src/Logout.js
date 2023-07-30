import React from 'react';


function Logout(props) {
  function handleLogout() {
    console.log('In handleLogout');
    localStorage.removeItem('token');
    props.setLoggedIn(false);
  }

  return  (
  <div className='log-out-container'>
    <button className="transparent-button log-out" onClick={handleLogout}>
      Log Out
    </button>
  </div>
  );
}

export default Logout;
