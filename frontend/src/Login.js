import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);


function Login(props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function handleAltButtonClick() {
    setIsCreatingAccount(prev => !prev);
    setErrorMsg('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = isCreatingAccount ? `${API_URL}/api/accounts` : `${API_URL}/api/login`;
    console.log('In handleSubmit, url is', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, pw}),
      });
      console.log(response);
      
      if (response.status === 200) {
        console.log('Success!');
        setErrorMsg('');

        // If we were logging in, get the JWT from the response body, and set it in local storage.
        // Then update our state to so that isLoggedIn is true.
        if (!isCreatingAccount) {
          const responseBody = await response.json();
          localStorage.setItem('token', responseBody.token);
          props.setIsLoggedIn(true); 
        }
        
      } else {
        const responseBody = await response.json();
        console.error('Error. responseBody:', responseBody);
        if (responseBody.error === 'No account has this email' || responseBody.error === 'Invalid password') {
          setErrorMsg('Invalid email or password');
        } else {
          setErrorMsg(responseBody.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg(error);
    }
  }

  return (
    <div className="login-container">
      <h2>{isCreatingAccount ? 'Create Account' : 'Log In'}</h2>

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />

        {!isCreatingAccount &&
        <button type="button" className="transparent-button forgot-pw"> {/* add onClick={handleForgotPwClick} */}
          Forgot password?
        </button>
        }

        <button type="submit" className="login-or-create-account-primary">
          {isCreatingAccount ? 'Create Account' : 'Log In'}
        </button>
      </form>
      {errorMsg !== '' && <p className="error-msg">{errorMsg}</p>}

      <hr className="login-box-line" />

      <button className="login-or-create-account-alt" onClick={handleAltButtonClick}>
        {isCreatingAccount ? 'Log In to Existing Account' : 'Create New Account'}
      </button>

    </div>
  );
}

export default Login;
