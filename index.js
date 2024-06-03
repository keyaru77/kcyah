const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;

app.get('/manga/:endpoint', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.CHROME_EXECUTABLE_PATH || '/usr/bin/google-chrome'
  });
  const page = await browser.newPage();

  try {
    const { endpoint } = req.params;
    const url = `${BASE_URL}${endpoint}`;

    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const title = $('h1.entry-title').text().trim();
    const firstChapter = $('.hl-firstlast-ch.first-chapter a').attr('href');
    const firstChapterLabel = $('.hl-firstlast-ch.first-chapter .barunew').text().trim();
    const latestChapter = $('.hl-firstlast-ch a[href*="chapter-"]').not('.first-chapter a').attr('href');
    const latestChapterLabel = $('.hl-firstlast-ch a[href*="chapter-"] .barunew').text().trim();
    const rating = $('i[itemprop="ratingValue"]').text().trim();
    
    const infoBox = {};
    $('.col-info-manga-box span').each((i, el) => {
      const key = $(el).find('b').text().replace(':', '').trim();
      const value = $(el).text().replace(key, '').trim();
      infoBox[key] = value;
    });

    const genres = [];
    $('.genre-info-manga a').each((i, el) => {
      genres.push($(el).attr('title'));
    });

    const description = $('.entry-content.entry-content-single p').text().trim();

    const additionalInfo = {};
    $('.info-additional b').each((i, el) => {
      const key = $(el).text().trim();
      const value = $(el).next().text().trim();
      additionalInfo[key] = value;
    });

    const similarManga = [];
    $('#similiar .list-series-manga .thumbnail-series').each((i, el) => {
      const similarTitle = $(el).find('img').attr('title');
      const similarHref = $(el).find('a.series').attr('href');
      const similarImg = $(el).find('img').attr('src');
      similarManga.push({ title: similarTitle, href: similarHref, img: similarImg });
    });

    const chapters = [];
    $('.box-list-chapter ul li').each((i, el) => {
      const chapterTitle = $(el).find('a').text().trim();
      const chapterHref = $(el).find('a').attr('href');
      const chapterDate = $(el).find('.list-chapter-date').text().trim();
      chapters.push({ title: chapterTitle, href: chapterHref, date: chapterDate });
    });

    res.json({
      title,
      firstChapter: { href: firstChapter, label: firstChapterLabel },
      latestChapter: { href: latestChapter, label: latestChapterLabel },
      rating,
      infoBox,
      genres,
      description,
      additionalInfo,
      similarManga,
      chapters
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
