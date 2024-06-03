const { scrapeMangaDetails } = require('../scraper/mangaScraper');

exports.getMangaDetails = async (req, res) => {
    const { endpoint } = req.params;
    try {
        const mangaDetails = await scrapeMangaDetails(endpoint);
        res.json(mangaDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape manga details' });
    }
};
