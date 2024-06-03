const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const mangaRouter = require('./src/routers/mangaRouter');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/manga', mangaRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
