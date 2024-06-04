const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const url = `https://komikcast.cx/komik/${endpoint}/`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Origin': 'https://komikcast.cx',
        'Cookie': '_ga=GA1.2.826878888.1673844093; _gid=GA1.2.1599003702.1674031831; _gat=1',
        'Referer': 'https://komikcast.cx',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim();
    const firstChapterLink = $('.hl-firstlast-ch.first-chapter a').attr('href');
    const firstChapterText = $('.hl-firstlast-ch.first-chapter .barunew').text().trim();
    const lastChapterLink = $('.hl-firstlast-ch a').not('.first-chapter a').attr('href');
    const lastChapterText = $('.hl-firstlast-ch a').not('.first-chapter a').find('.barunew').text().trim();
    const rating = $('i[itemprop="ratingValue"]').text().trim();
    const info = {};
    $('.col-info-manga-box span').each((_, el) => {
      const key = $(el).find('b').text().trim().replace(':', '');
      const value = $(el).find('a').length ? $(el).find('a').text().trim() : $(el).text().replace($(el).find('b').text().trim(), '').trim();
      info[key] = value;
    });

    const genres = [];
    $('.genre-info-manga a').each((_, el) => {
      genres.push($(el).attr('title').trim());
    });

    const synopsis = $('.entry-content.entry-content-single p').text().trim();
    const additionalInfo = {};
    $('.info-additional b').each((_, el) => {
      additionalInfo[$(el).text().trim()] = $(el).next().text().trim();
    });

    const relatedManga = [];
    $('#similiar .series').each((_, el) => {
      relatedManga.push({
        title: $(el).attr('title'),
        href: $(el).attr('href'),
        img: $(el).find('img').attr('src')
      });
    });

    const chapters = [];
    $('.box-list-chapter ul li').each((_, el) => {
      const chapter = $(el).find('span a').first().text().trim();
      const chapterLink = $(el).find('span a').first().attr('href');
      const chapterDate = $(el).find('.list-chapter-date a').text().trim();
      const downloadLink = $(el).find('.dl a').attr('href');
      chapters.push({ chapter, chapterLink, chapterDate, downloadLink });
    });

    res.json({
      title,
      firstChapter: {
        text: firstChapterText,
        link: firstChapterLink
      },
      lastChapter: {
        text: lastChapterText,
        link: lastChapterLink
      },
      rating,
      info,
      genres,
      synopsis,
      additionalInfo,
      relatedManga,
      chapters
    });
  } catch (error) {
    res.status(500).send('An error occurred while fetching the data.');
  }
});

module.exports = router;
