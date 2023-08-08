import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;


function Account(props) {
  const [email, setEmail] = useState('');

  async function fetchEmail() {
    try {
      const response = await fetch(`${API_URL}/api/email`,
                                  {headers: {Authorization: localStorage.getItem('token')}}
      );
      console.log('the response from GET /api/email was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
      console.log('the response body from the GET /api/email was', responseBody);
      if (responseBody.error) {
        console.error('Failed to fetch email:', responseBody.error);
        props.onUnauthorized(); // account deleted on one browser but other browser still has JWT
      } else {
        setEmail(responseBody.email);
      }

    } catch (err) {
      console.error('An error occurred while fetching email:', err);
      setEmail('');
    }
  }
  useEffect(() => {
    fetchEmail();
  }, []);

  async function handleDeleteAccount() {
    const deleteConfirmed = window.confirm('Are you sure you want to delete your account?');
    if (!deleteConfirmed) { // user pressed cancel
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/account`, {
          method: 'DELETE', 
          headers: {'Authorization': localStorage.getItem('token')}
        }
      );
      console.log('the response from DELETE /api/account was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.onUnauthorized();
      }

      const responseBody = await response.json();
      console.log('the response from DELETE /api/account was', responseBody);
      if (responseBody.error) {
        console.error(responseBody.error);
      } else {
        props.onUnauthorized(); // account successfully deleted, so also remove JWT and set state to logged out
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <h2 className="overview-heading">Account</h2>
      <hr className="horizontal-line" />
      <div className="account-container">
        <p className="account-item">{email}</p>
        <button className="account-item blue-button">
          Change Password
        </button>
        <button className="account-item coral-button" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </>
  );
}

export default Account;
