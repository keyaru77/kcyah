const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const helmet = require('helmet');
const cors = require('cors');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

// Function to scrape manga details
async function scrapeManga(endpoint) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    try {
        const response = await client.get(`https://komikcast.cx/komik/${endpoint}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        const $ = cheerio.load(response.data);
        const title = $('h1.entry-title').text().trim();
        const firstChapterLink = $('.hl-firstlast-ch.first-chapter a').attr('href');
        const firstChapterText = $('.hl-firstlast-ch.first-chapter .barunew').text().trim();
        const latestChapterLink = $('.hl-firstlast-ch:not(.first-chapter) a').attr('href');
        const latestChapterText = $('.hl-firstlast-ch:not(.first-chapter) .barunew').text().trim();
        const rating = $('i[itemprop="ratingValue"]').text().trim();
        const info = {};
        $('.col-info-manga-box span').each((i, el) => {
            const text = $(el).text().trim().replace(/\n/g, '').replace(/ {2,}/g, ' ');
            info[text.split(':')[0].trim()] = text.split(':')[1]?.trim() || '';
        });
        const genres = [];
        $('.genre-info-manga a').each((i, el) => {
            genres.push($(el).attr('title'));
        });
        const description = $('.entry-content.entry-content-single p').text().trim();
        const additionalInfo = {};
        $('.info-additional b').each((i, el) => {
            additionalInfo[$(el).text().trim()] = $(el).next().text().trim();
        });
        const similarManga = [];
        $('.related-manga .series').each((i, el) => {
            similarManga.push({
                title: $(el).attr('title'),
                link: $(el).attr('href'),
                image: $(el).find('img').attr('src'),
            });
        });
        const chapters = [];
        $('.box-list-chapter li').each((i, el) => {
            chapters.push({
                chapter: $(el).find('.list-chapter-chapter a').text().trim(),
                link: $(el).find('.list-chapter-chapter a').attr('href'),
                date: $(el).find('.list-chapter-date').text().trim(),
            });
        });

        return {
            title,
            firstChapter: {
                text: firstChapterText,
                link: firstChapterLink,
            },
            latestChapter: {
                text: latestChapterText,
                link: latestChapterLink,
            },
            rating,
            info,
            genres,
            description,
            additionalInfo,
            similarManga,
            chapters,
        };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to scrape manga details');
    }
}

app.get('/manga/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    try {
        const mangaDetails = await scrapeManga(endpoint);
        res.json(mangaDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
