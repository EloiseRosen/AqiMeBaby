import React, { useState, useEffect } from 'react';
import Logout from './Logout';
import Header from './Header';
import Login from './Login';
import Account from './Account';
import Alerts from './Alerts';
import ResetPw from './ResetPw';
import Footer from './Footer';

const URL = process.env.REACT_APP_URL;
console.log(URL);


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pwResetToken, setPwResetToken] = useState(null);
  const [pwResetSuccessMsg, setPwResetSuccessMsg] = useState('');
  const [accountPwResetMsg, setAccountPwResetMsg] = useState('');

  function handleUnauthorized() { // received 401, logged out, or deleted account
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    setPwResetSuccessMsg('');
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
            setPwResetSuccessMsg('');
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

  useEffect(() => { // if pwResetToken is in URL, update pwResetToken state so we can show the ResetPw component
    const urlParams = new URLSearchParams(window.location.search);
    const pwResetTokenFromUrl = urlParams.get('pwResetToken');
    if (pwResetTokenFromUrl) {
      setPwResetToken(pwResetTokenFromUrl);
    }
  }, []);
  
  function handlePwResetSuccess() {
    window.history.replaceState({}, document.title, window.location.pathname); // replace current URL with the same URL except pwResetToken removed
    setPwResetToken(null);
    handleUnauthorized(); // have them log back in
    setPwResetSuccessMsg('Password Reset Successfully!');
  };

  return (
    <>
      <div className="main">
        {isLoggedIn && <Logout onLogout={handleUnauthorized} />}
        <Header isLoggedIn={isLoggedIn} />
        {pwResetToken !== null ? (
          <ResetPw onPwResetSuccess={handlePwResetSuccess} pwResetToken={pwResetToken}/>
          ) : (
          <>
            {!isLoggedIn && 
              <Login
                setIsLoggedIn={setIsLoggedIn} 
                pwResetSuccessMsg={pwResetSuccessMsg} 
                setPwResetSuccessMsg={setPwResetSuccessMsg}
                setAccountPwResetMsg={setAccountPwResetMsg}
              />
            }
            {isLoggedIn && 
              <Account 
                onUnauthorized={handleUnauthorized} 
                accountPwResetMsg={accountPwResetMsg} 
                setAccountPwResetMsg={setAccountPwResetMsg} 
              />
            }
            {isLoggedIn && <Alerts onUnauthorized={handleUnauthorized} />}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default App;
