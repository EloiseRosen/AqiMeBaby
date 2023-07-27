import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);


function Login(props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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
      const data = await response.json();
      if (data.status === 'success') {
        console.log('Success:', data);
        setErrorMsg('');
      } else {
        console.error('Error:', data.error);
        if (data.error === 'No account has this email' || data.error === 'Invalid password') {
          setErrorMsg('Invalid email or password');
        } else {
          setErrorMsg(data.error);
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
        <button className="transparent-button forgot-pw"> {/* add onClick={onForgotPwClick} */}
          Forgot password?
        </button>
        }

        <button type="submit" className="login-or-create-account-primary">
          {isCreatingAccount ? 'Create Account' : 'Log In'}
        </button>
      </form>
      {errorMsg !== '' && <p className="error-msg">{errorMsg}</p>}

      <hr className="login-box-line" />

      <button className="login-or-create-account-alt" onClick={() => setIsCreatingAccount(prev => !prev)}>
        {isCreatingAccount ? 'Log In to Existing Account' : 'Create New Account'}
      </button>

    </div>
  );
}

export default Login;
