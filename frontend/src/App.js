import React, { useEffect } from 'react';
import Header from './Header';
import Login from './Login';
import Footer from './Footer';

const API_URL = process.env.REACT_APP_API_URL;
console.log(API_URL);


function App() {
  useEffect(() => {
    async function fetchMsg() {
      try {
        const response = await fetch(`${API_URL}/api`);
        const data = await response.json();
        console.log(data);
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
        if (data.length > 0) {
          for (const account of data) {
            console.log(`ID: ${account.id}`);
            console.log(`Name: ${account.email}`);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    fetchAccounts();
  }, []);

  return (
    <>
      <div className="main">
        <Header />
        <Login />   
      </div>
      <Footer />

    </>
  );
}

export default App;
