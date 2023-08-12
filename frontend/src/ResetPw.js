import React, { useState } from 'react';

const URL = process.env.REACT_APP_URL;


/**
 * The ResetPw component provides functionality for resetting password.
 * Password visibility can be toggled, and an error message is shown as
 * applicable.
 */
function ResetPw(props) {
  const [pw, setPw] = useState('');
  const [isPwVisible, setIsPwVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * When user submits their new password, a POST request is sent to
   * backend. If password has been successfully changed, success message is
   * shown and we go back to login view. On error, error message is shown.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${URL}/api/resetPassword`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({newPw: pw, pwResetToken: props.pwResetToken}),
      });

      if (response.status === 200) {
        props.onPwResetSuccess();
      } else {
        const responseBody = await response.json();
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
