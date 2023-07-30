import React, { useState, useEffect } from 'react';
import Logout from './Logout';
import Header from './Header';
import Login from './Login';
import Alerts from './Alerts';
import Footer from './Footer';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //  when component mounts, check whether user is authenticated 
  useEffect(() => {
    async function verifyJwt() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // check if their token is still valid
          const response = await fetch(`${API_URL}/api/jwt`, {
            method: 'GET',
            headers: {'Authorization': token},
          });

          if (response.status === 200) {
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
          }

        } catch (error) {
          console.error('Error:', error);
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
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

  return (
    <>
      <div className="main">
        {isLoggedIn && <Logout setIsLoggedIn={setIsLoggedIn} />}
        <Header />
        {!isLoggedIn && <Login setIsLoggedIn={setIsLoggedIn} />}
        {isLoggedIn && <Alerts setIsLoggedIn={setIsLoggedIn} />}
      </div>
      <Footer />
    </>
  );
}

export default App;
