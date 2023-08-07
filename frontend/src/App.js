import React, { useState, useEffect } from 'react';
import Logout from './Logout';
import Header from './Header';
import Login from './Login';
import Account from './Account';
import Alerts from './Alerts';
import Footer from './Footer';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //  when component mounts, check whether user is authenticated
  useEffect(() => {
    async function verifyJwt() {
      // const token = localStorage.getItem('token'); // now using httpOnly cookie instead of local storage

      try {
        // check if their token is still valid
        const response = await fetch(`${API_URL}/api/jwt`, {
          method: 'GET',
          // headers: {'Authorization': token},
          credentials: 'include', // makes cookies be included, which we need because our JWT is now stored in cookie
          
        });

        if (response.status === 200) {
          setIsLoggedIn(true);
        } else {
          // localStorage.removeItem('token');
          setIsLoggedIn(false);
        }

      } catch (error) {
        console.error('Error:', error);
        // localStorage.removeItem('token');
        setIsLoggedIn(false);
      }

    }
    verifyJwt();
  }, []); // Empty dependency array -> run once on component mount
  
  /*
  useEffect(() => {
    async function testExternalAPI() {
      try {
        const response = await fetch(`${API_URL}/api/external`);
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    testExternalAPI();
  }, []);
  */

  /*
  When someone presses a button in an individual component that does something through a protected route,
  sometimes the user isn't authorized for that action anymore (they had a valid JWT before, which is why the
  button is displayed, but in the meantime the JWT expired or otherwise). If an attempt is made to go through
  a protected route without a valid JWT, a 401 is sent back. In this case the  app's state should go back to 
  isLoggedIn being false.
  */
  function handle401() {
    console.log('received 401');
    setIsLoggedIn(false);
    // localStorage.removeItem('token');
  }

  async function handleLogout() {
    try {
      const response = await fetch(`${API_URL}/api/logout`, { // clears our JWT cookie
        method: 'POST',
        credentials: 'include'
      });
  
      if (response.ok) {
        setIsLoggedIn(false);
      } else {
        console.error('logout error');
      }
    } catch (error) {
      console.error('logout error:', error);
    }
  }

  return (
    <>
      <div className="main">
        {isLoggedIn && <Logout onLogout={handleLogout} />}
        <Header isLoggedIn={isLoggedIn} />
        {!isLoggedIn && <Login setIsLoggedIn={setIsLoggedIn} />}
        {isLoggedIn && <Account handle401={handle401} />}
        {isLoggedIn && <Alerts handle401={handle401} />}
      </div>
      <Footer />
    </>
  );
}

export default App;
