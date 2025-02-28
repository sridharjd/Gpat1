const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;

// Allow requests from your React app
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    credentials: true // Allow credentials if needed
}));

app.use(require('./app'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});