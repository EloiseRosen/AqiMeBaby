import React, { useState } from 'react';

const URL = process.env.REACT_APP_URL;


function ResetPw(props) {
  const [pw, setPw] = useState('');
  const [isPwVisible, setIsPwVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${URL}/api/resetPassword`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({newPw: pw, pwResetToken: props.pwResetToken}),
      });
      console.log(response);
      
      if (response.status === 200) {
        console.log('Pw reset success');
        props.onPwResetSuccess();
      } else {
        const responseBody = await response.json();
        console.error('Error. responseBody:', responseBody);
        setErrorMsg(responseBody.error);
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorMsg(err);
    }
  }

  return (
    <div className="login-container">
      <h2>Reset Password</h2>

      <form onSubmit={handleSubmit}>
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

        <button type="submit" className="blue-button press-down">
          Reset Password
        </button>
      </form>
      {errorMsg !== '' && <p className="error-msg">{errorMsg}</p>}

    </div>
  );
}

export default ResetPw;
