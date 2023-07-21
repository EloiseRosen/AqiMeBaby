import React, { useEffect, useState } from 'react';
import AlertBox from './AlertBox';


function App() {
  const [serverMessage, setServerMessage] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('http://localhost:3001/api');
        const data = await response.json();
        setServerMessage(data.message);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    fetchData();
  }, []); // Empty dependency array -> run once on component mount

  return (
    <>
      <h1>AQI Me Baby</h1>
      {serverMessage !== null && <p>{serverMessage}</p>}
      <AlertBox />
    </>
  );
}

export default App;
