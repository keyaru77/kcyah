const express = require('express');
const cors = require('cors');
const mangaRoute = require('./routes/manga');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/manga', mangaRoute);

app.get('/', (req, res) => {
  res.send('Welcome to the Web Scraper API!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
