const { chromium } = require('playwright');

async function scrapeManga(endpoint) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set user agent to mimic a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // Replace the base URL with the actual manga page URL
  const url = `https://komikcast.cx/komik/${endpoint}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const data = await page.evaluate(() => {
    const getTitle = () => document.querySelector('h1.entry-title')?.textContent.trim() || '';
    const getFirstChapterLink = () => document.querySelector('div.hl-firstlast-ch.first-chapter a')?.href || '';
    const getFirstChapterName = () => document.querySelector('div.hl-firstlast-ch.first-chapter span.barunew')?.textContent.trim() || '';
    const getLastChapterLink = () => document.querySelector('div.hl-firstlast-ch:last-child a')?.href || '';
    const getLastChapterName = () => document.querySelector('div.hl-firstlast-ch:last-child span.barunew')?.textContent.trim() || '';
    const getRating = () => document.querySelector('i[itemprop="ratingValue"]')?.textContent.trim() || '';
    const getInfo = () => Array.from(document.querySelectorAll('div.col-info-manga-box span'))
                              .map(el => el.textContent.trim())
                              .filter(text => !text.includes('Manga'));
    const getGenres = () => Array.from(document.querySelectorAll('div.genre-info-manga a'))
                                .map(el => el.getAttribute('title'));
    const getDescription = () => document.querySelector('div.entry-content.entry-content-single p')?.textContent.trim() || '';
    const getAdditionalInfo = () => Array.from(document.querySelectorAll('div.info-additional b')).map(el => el.textContent.trim());
    const getSimilarManga = () => Array.from(document.querySelectorAll('div.related-manga a.series')).map(el => ({
      link: el.href,
      image: el.querySelector('img')?.src,
      title: el.querySelector('img')?.title
    }));
    const getChapters = () => Array.from(document.querySelectorAll('div.box-list-chapter ul li')).map(el => ({
      link: el.querySelector('a')?.href,
      name: el.querySelector('chapter')?.textContent.trim(),
      date: el.querySelector('span.list-chapter-date')?.textContent.trim(),
      year: el.querySelector('span.dl a')?.textContent.trim()
    }));

    return {
      title: getTitle(),
      firstChapter: {
        link: getFirstChapterLink(),
        name: getFirstChapterName()
      },
      lastChapter: {
        link: getLastChapterLink(),
        name: getLastChapterName()
      },
      rating: getRating(),
      info: getInfo(),
      genres: getGenres(),
      description: getDescription(),
      additionalInfo: getAdditionalInfo(),
      similarManga: getSimilarManga(),
      chapters: getChapters()
    };
  });

  await browser.close();
  return data;
}

module.exports = scrapeManga;
