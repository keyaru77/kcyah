const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Linux; Android 9; Mi A1 Build/PKQ1.180917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.159 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

app.get('/manga/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const url = `https://komikcast.cx/komik/${endpoint}`;

  try {
    const { data } = await client.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://komikcast.cx/',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const $ = cheerio.load(data);
    const title = $('h1.entry-title').text().trim();
    const firstChapter = $('div.hl-firstlast-ch.first-chapter a').attr('href');
    const firstChapterText = $('div.hl-firstlast-ch.first-chapter a .barunew').text().trim();
    const lastChapter = $('div.hl-firstlast-ch a').eq(1).attr('href');
    const lastChapterText = $('div.hl-firstlast-ch a').eq(1).find('.barunew').text().trim();
    const rating = $('i[itemprop="ratingValue"]').text().trim();
    const colInfo = {};
    $('div.col-info-manga-box span').each((i, el) => {
      const text = $(el).text().trim();
      if (!$(el).find('a').length) {
        const key = $(el).find('b').text().trim().replace(':', '');
        const value = text.replace($(el).find('b').text().trim(), '').trim();
        colInfo[key] = value;
      }
    });
    const genres = [];
    $('div.genre-info-manga a').each((i, el) => {
      genres.push($(el).attr('title'));
    });
    const description = $('div.entry-content.entry-content-single p').text().trim();
    const additionalInfo = {};
    $('div.info-additional b').each((i, el) => {
      const key = $(el).text().trim().replace(':', '');
      const value = $(el).next().text().trim();
      additionalInfo[key] = value;
    });
    const excerpt = $('div.excerpt-similiar').text().trim();
    const spoilerImage = $('div#spoiler-manga img').attr('src');
    const relatedManga = [];
    $('div.related-manga a.series').each((i, el) => {
      const mangaUrl = $(el).attr('href');
      const imgSrc = $(el).find('img').attr('src');
      relatedManga.push({ url: mangaUrl, image: imgSrc });
    });
    const chapters = [];
    $('div.box-list-chapter li').each((i, el) => {
      const chapterUrl = $(el).find('a').attr('href');
      const chapterText = $(el).find('.list-chapter-chapter').text().trim();
      const date = $(el).find('.list-chapter-date').text().trim();
      const year = date.match(/\d{4}/);
      chapters.push({ url: chapterUrl, chapter: chapterText, date, year });
    });

    res.json({
      title,
      firstChapter: { url: firstChapter, text: firstChapterText },
      lastChapter: { url: lastChapter, text: lastChapterText },
      rating,
      colInfo,
      genres,
      description,
      additionalInfo,
      excerpt,
      spoilerImage,
      relatedManga,
      chapters,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
