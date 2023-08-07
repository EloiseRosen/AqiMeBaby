import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;


function Account(props) {
  const [email, setEmail] = useState('');

  async function fetchEmail() {
    try {
      const response = await fetch(`${API_URL}/api/email`, {
        // headers: {Authorization: localStorage.getItem('token')} // no longer using local storange
        credentials: 'include', // makes cookies be included, which we need because our JWT is now stored in cookie
      });
      console.log('the response from GET /api/email was', response);

      // got back a 401 so we should be logged out (in which case this component doesn't render)
      if (response.status === 401) {
        props.handle401();
      }

      const responseBody = await response.json();
      console.log('the response body from the GET /api/email was', responseBody);
      if (responseBody.error) {
        console.error('Failed to fetch email:', responseBody.error);
        setEmail('');
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


  return (
    <>
      <h2 className="overview-heading">Account</h2>
      <hr className="horizontal-line" />
      <div className="account-container">
        <p className="account-item">{email}</p>
        <button className="account-item blue-button">
          Change Password
        </button>
        <button className="account-item coral-button">
          Delete Account
        </button>
      </div>
    </>
  );
}

export default Account;
