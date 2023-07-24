import React, { useState } from 'react';


function Login(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    console.log(email, password); // TODO send to backend
  }

  return (
    <div className="login-container">
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="transparent-button forgot-pw"> {/* add onClick={onForgotPwClick} */}
          Forgot password?
        </button>
        <button type="submit" className="login-button">Log In</button>
      </form>
      <hr className="login-box-line" />
      <button className="create-account-button">Create New Account</button>
    </div>
  );
}

export default Login;
