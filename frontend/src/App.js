import React, { useState, useEffect } from 'react';
import Logout from './Logout';
import Header from './Header';
import Login from './Login';
import Account from './Account';
import Alerts from './Alerts';
import Footer from './Footer';

const URL = process.env.REACT_APP_URL;
console.log(URL);


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleUnauthorized() { // received 401, logged out, or deleted account
    setIsLoggedIn(false);
    localStorage.removeItem('token');
  }

  //  when component mounts, check whether user is authenticated
  useEffect(() => {
    async function verifyJwt() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // check if their token is still valid
          const response = await fetch(`${URL}/api/jwt`, {
            method: 'GET',
            headers: {'Authorization': token},
          });

          if (response.status === 200) {
            setIsLoggedIn(true);
          } else {
            handleUnauthorized();
          }

        } catch (error) {
          console.error('Error:', error);
          handleUnauthorized();
        }
      }
    }
    verifyJwt();
  }, []); // Empty dependency array -> run once on component mount
  

  useEffect(() => {
    async function testExternalAPI() {
      try {
        const response = await fetch(`${URL}/api/external`);
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    testExternalAPI();
  }, []);



  return (
    <>
      <div className="main">
        {isLoggedIn && <Logout onLogout={handleUnauthorized} />}
        <Header isLoggedIn={isLoggedIn} />
        {!isLoggedIn && <Login setIsLoggedIn={setIsLoggedIn} />}
        {isLoggedIn && <Account onUnauthorized={handleUnauthorized} />}
        {isLoggedIn && <Alerts onUnauthorized={handleUnauthorized} />}
      </div>
      <Footer />
    </>
  );
}

export default App;
