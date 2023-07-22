import React, { useEffect, useState } from 'react';
import AlertBox from './AlertBox';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);


function App() {
  const [serverMessage, setServerMessage] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    async function fetchMsg() {
      try {
        const response = await fetch(`${API_URL}/api`);
        const data = await response.json();
        setServerMessage(data.message);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    fetchMsg();
  }, []); // Empty dependency array -> run once on component mount

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch(`${API_URL}/api/accounts`);
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    fetchAccounts();
  }, []);

  return (
    <>
      <h1>AQI Me Baby</h1>
      {serverMessage !== null && <p>{serverMessage}</p>}
      {accounts.length > 0 && (
        <div>
          <h2>Accounts</h2>
          {accounts.map((account, idx) => (
            <div key={idx}>
              <p>ID: {account.id}</p>
              <p>Name: {account.email}</p>
            </div>
          ))}
        </div>
      )}
      <AlertBox />
    </>
  );
}

export default App;
