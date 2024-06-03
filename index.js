const express = require('express');
const cheerio = require('cheerio');
const helmet = require('helmet');
const cors = require('cors');
const chromium = require('chrome-aws-lambda');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

async function scrapeManga(endpoint) {
    let browser = null;

    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto(`https://komikcast.cx/komik/${endpoint}`, {
            waitUntil: 'networkidle2',
        });

        const content = await page.content();
        const $ = cheerio.load(content);

        const title = $('h1.entry-title').text().trim();
        if (!title) throw new Error('Failed to extract title. The page structure might have changed.');

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

        await browser.close();

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
        if (browser) await browser.close();
        if (error.response) {
            throw new Error(`Failed to request the manga page: ${error.response.status} ${error.response.statusText}`);
        } else {
            throw new Error(`An error occurred: ${error.message}`);
        }
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
