const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

app.use(helmet());
app.use(cors());

async function fetchMangaDetails(endpoint) {
  try {
    const { data } = await client.get(`https://komikcast.cx/komik/${endpoint}`);
    const $ = cheerio.load(data);

    const title = $('h1.entry-title').text().trim();
    const rating = $('i[itemprop="ratingValue"]').text().trim();
    const description = $('div.entry-content.entry-content-single p').text().trim();

    const firstChapterUrl = $('.hl-firstlast-ch.first-chapter a').attr('href');
    const firstChapterTitle = $('.hl-firstlast-ch.first-chapter .barunew').text().trim();
    const latestChapterUrl = $('.hl-firstlast-ch').last().find('a').attr('href');
    const latestChapterTitle = $('.hl-firstlast-ch').last().find('.barunew').text().trim();

    const infoBox = {};
    $('div.col-info-manga-box span').each((i, el) => {
      const key = $(el).find('b').text().replace(':', '').trim();
      const value = $(el).clone().children().remove().end().text().trim();
      infoBox[key] = value;
    });

    const genres = [];
    $('div.genre-info-manga a').each((i, el) => {
      genres.push($(el).attr('title'));
    });

    const additionalInfo = [];
    $('div.info-additional b').each((i, el) => {
      additionalInfo.push($(el).text().trim());
    });

    const similarManga = [];
    $('#similiar .list-series-manga ul li').each((i, el) => {
      const mangaUrl = $(el).find('a.series').attr('href');
      const mangaImg = $(el).find('a.series img').attr('src');
      similarManga.push({ url: mangaUrl, img: mangaImg });
    });

    const chapters = [];
    $('.box-list-chapter ul li').each((i, el) => {
      const chapterUrl = $(el).find('a').attr('href');
      const chapterTitle = $(el).find('chapter').text().trim();
      const chapterDate = $(el).find('.list-chapter-date').text().trim();
      const chapterDownloadUrl = $(el).find('.dl a').attr('href');
      chapters.push({ url: chapterUrl, title: chapterTitle, date: chapterDate, downloadUrl: chapterDownloadUrl });
    });

    return {
      title,
      rating,
      description,
      firstChapter: { url: firstChapterUrl, title: firstChapterTitle },
      latestChapter: { url: latestChapterUrl, title: latestChapterTitle },
      infoBox,
      genres,
      additionalInfo,
      similarManga,
      chapters
    };

  } catch (error) {
    console.error(error);
    return null;
  }
}

app.get('/manga/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const mangaDetails = await fetchMangaDetails(endpoint);
  if (mangaDetails) {
    res.json(mangaDetails);
  } else {
    res.status(404).json({ error: 'Manga not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
