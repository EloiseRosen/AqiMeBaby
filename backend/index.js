const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db-connection.js');


const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend/build'))); // serve static files from frontend

app.get('/api', (req, res) => {
    res.json({message: 'Hello from server!'});
});




app.get('/api/accounts', async (req, res) => {
    try {
        const allAccounts = await pool.query('SELECT * FROM account');
        res.json(allAccounts.rows);
    } catch (err) {
        console.error(err.message);
    }
});




app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});
