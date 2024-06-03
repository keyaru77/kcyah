const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://komikcast.cx/komik/';

const scrapeMangaDetails = async (endpoint) => {
    try {
        const { data } = await axios.get(`${BASE_URL}${endpoint}`);
        const $ = cheerio.load(data);

        const title = $('h1.entry-title').text().trim();
        const firstChapterLink = $('div.hl-firstlast-ch.first-chapter a').attr('href');
        const firstChapterText = $('div.hl-firstlast-ch.first-chapter span.barunew').text().trim();
        const latestChapterLink = $('div.hl-firstlast-ch a:last-child').attr('href');
        const latestChapterText = $('div.hl-firstlast-ch a:last-child span.barunew').text().trim();
        const rating = $('i[itemprop="ratingValue"]').text().trim();
        
        const colInfoManga = [];
        $('div.col-info-manga-box span').each((_, element) => {
            colInfoManga.push($(element).text().trim());
        });

        const genres = [];
        $('div.genre-info-manga a').each((_, element) => {
            genres.push($(element).attr('title'));
        });

        const synopsis = $('div.entry-content.entry-content-single p').text().trim();

        const additionalInfo = [];
        $('div.info-additional b').each((_, element) => {
            additionalInfo.push($(element).text().trim());
        });

        const similarManga = [];
        $('div.related-manga.id.similiar a.series').each((_, element) => {
            similarManga.push({
                title: $(element).attr('title'),
                link: $(element).attr('href'),
                imgSrc: $(element).find('img').attr('src')
            });
        });

        const chapters = [];
        $('div.box-list-chapter li').each((_, element) => {
            chapters.push({
                chapterLink: $(element).find('a').attr('href'),
                chapterDate: $(element).find('span.list-chapter-date').text().trim(),
                downloadLink: $(element).find('span.dl a').attr('href')
            });
        });

        return {
            title,
            firstChapter: { link: firstChapterLink, text: firstChapterText },
            latestChapter: { link: latestChapterLink, text: latestChapterText },
            rating,
            colInfoManga,
            genres,
            synopsis,
            additionalInfo,
            similarManga,
            chapters
        };
    } catch (error) {
        throw new Error('Failed to scrape manga details');
    }
};

module.exports = { scrapeMangaDetails };
