const express = require('express');
const { getMangaDetails } = require('../controllers/mangaController');

const router = express.Router();

router.get('/:endpoint', getMangaDetails);

module.exports = router;
