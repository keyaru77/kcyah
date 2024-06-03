const express = require('express');
const scrapeManga = require('./scraper');

const app = express();
const port = process.env.PORT || 3000;

app.get('/manga/:endpoint', async (req, res) => {
  try {
    const endpoint = req.params.endpoint;
    const data = await scrapeManga(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
