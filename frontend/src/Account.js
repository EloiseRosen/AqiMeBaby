import React, { useState, useEffect } from 'react';

const URL = process.env.REACT_APP_URL;


/**
 * The Account component displays account information and provides 
 * functionality for account management actions (change password,
 * delete account).
 */
function Account(props) {
  const [email, setEmail] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  /**
   * Fetch the email address associated with this account.
   * Set warning message state based on whether user has verified email address or not.
   */
  async function fetchEmail() {
    try {
      const response = await fetch(`${URL}/api/email`,
                                  {headers: {Authorization: localStorage.getItem('token')}}
      );

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
      if (responseBody.error) {
        console.error('Failed to fetch email:', responseBody.error);
        props.onUnauthorized(); // account deleted on one browser but other browser still has JWT
      } else {
        setEmail(responseBody.email);
        setEmailConfirmed(responseBody.confirmed_email);
      }

    } catch (err) {
      console.error('An error occurred while fetching email:', err);
      setEmail('');
    }
  }
  useEffect(() => {
    fetchEmail();
  }, []);

  /**
   * When user clicks "Delete Account" button, confirm with user, then delete account
   * from database, remove JWT, and set state to logged out.
   */
  async function handleDeleteAccount() {
    const deleteConfirmed = window.confirm('Are you sure you want to delete your account?');
    if (!deleteConfirmed) { // user pressed cancel
      return;
    }

    try {
      const response = await fetch(`${URL}/api/account`, {
          method: 'DELETE', 
          headers: {'Authorization': localStorage.getItem('token')}
        }
      );

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
      if (responseBody.error) {
        console.error(responseBody.error);
      } else {
        props.onUnauthorized(); // account successfully deleted, so also remove JWT and set state to logged out
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * When user clicks on the "Change Password" button, send a password reset email to their
   * email address.
   */
  async function handleForgotPwClick() {
    try {
      props.setAccountPwResetMsg('A password reset email has been sent');
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
    <>
      <h2 className="overview-heading">Account</h2>
      <hr className="horizontal-line" />
      <div className="account-container">
        <div className="account-inline-container">
          <p className="account-item">{email}</p>
          <button className="account-item blue-button" onClick={handleForgotPwClick}>
            Change Password
          </button>
          <button className="account-item coral-button" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
        {emailConfirmed === false && <p className="error-msg account">email hasn't been confirmed so no alerts can be sent (refresh page to refresh status)</p>}
        {props.accountPwResetMsg !== '' && <p className="error-msg account pw-reset">{props.accountPwResetMsg}</p>}
      </div>
    </>
  );
}

export default Account;
