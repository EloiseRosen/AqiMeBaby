import React, { useState } from 'react';

const URL = process.env.REACT_APP_URL;


function Login(props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [isPwVisible, setIsPwVisible] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function handleAltButtonClick() {
    setIsCreatingAccount(prev => !prev);
    setErrorMsg('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = isCreatingAccount ? `${URL}/api/account` : `${URL}/api/login`;
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
        props.setPwResetSuccessMsg('');
        props.setAccountPwResetMsg('');

        // for create account and login paths, response body is our JWT ({token: token})
        const responseBody = await response.json();
        localStorage.setItem('token', responseBody.token);
        props.setIsLoggedIn(true); 
        
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

  async function handleForgotPwClick() {
    try {
      setErrorMsg('If an account with the typed-in email exists, a password reset email has been sent.');
      const response = await fetch(`${URL}/api/requestPasswordReset`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'email': email}),
      });
    } catch (err) {
      console.error('error:', err);
    }
  }
  
  return (
    <div className="login-container">
      {props.pwResetSuccessMsg !== '' && <p className='pw-reset-success-msg'>{props.pwResetSuccessMsg}</p>}
      <h2>{isCreatingAccount ? 'Create Account' : 'Log In'}</h2>

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <div className="pw-div">
          <input
            type={isPwVisible ? 'text' : 'password'}
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="pw-input"
          />
          <button type="button" className="transparent-button pw-eye" onClick={() => setIsPwVisible(prev => !prev)}>
            <i className={isPwVisible ? 'fa-solid  fa-eye' : 'fa-solid fa-eye-slash'}></i>
          </button>
        </div>


        {!isCreatingAccount &&
        <button type="button" className="transparent-button forgot-pw" onClick={handleForgotPwClick}>
          Forgot password?
        </button>
        }

        <button type="submit" className="blue-button press-down">
          {isCreatingAccount ? 'Create Account' : 'Log In'}
        </button>
      </form>
      {errorMsg !== '' && <p className="error-msg">{errorMsg}</p>}

      <hr className="horizontal-line" />

      <button className="coral-button press-down" onClick={handleAltButtonClick}>
        {isCreatingAccount ? 'Log In to Existing Account' : 'Create New Account'}
      </button>

    </div>
  );
}

export default Login;
