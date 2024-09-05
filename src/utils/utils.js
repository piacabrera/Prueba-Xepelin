
const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const { setTimeout } = require('timers/promises');

async function scrapeBlogArticle(url) {
  console.log(`Scraping article: ${url}`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

  const data = await page.evaluate(() => {
    const title = document.querySelector('h1.ArticleSingle_title__0DNjm')?.innerText || 'Desconocido';
    const author = document.querySelector('div.flex.gap-2 > div.text-sm.dark\\:text-text-disabled')?.innerText || 'Desconocido';
    const readingTime = document.querySelector('div.Text_body__snVk8')?.innerText || 'Desconocido';    
    const recommendedArticles = Array.from(document.querySelectorAll('.NewsArticle_content__v4xGa')).map(article => ({
      title: article.querySelector('h3.NewsArticle_title__EOcg7')?.innerText || 'Desconocido',
      date: article.querySelector('p.NewsArticle_date__2S2ly')?.innerText || 'Fecha no disponible'
    }));
    return { title, author, readingTime, recommendedArticles };
  });

  await browser.close();
  return data;
}


async function scrapeArticleLinks(categoryLink) {
  console.log(`Scraping article links from category: ${categoryLink}`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${categoryLink}`, { waitUntil: 'networkidle0', timeout: 0 });

  let loadMoreButtonExists = true;
  while (loadMoreButtonExists) {
    try {
      const [loadMoreButton] = await page.$$("xpath/.//button[contains(text(), 'Cargar más')]");
      if (loadMoreButton) {
        await loadMoreButton.click();
        await setTimeout(2000);
      }
      else {
        break
      }
    } catch (error) {
      console.log('No more "Load more" button found or timeout reached:', error);
      loadMoreButtonExists = false;
    }
  }
  const postLinks = await page.evaluate((categoryLink) => {
    const links = Array.from(document.querySelectorAll('a'));
    return links
      .filter(link => link.href.startsWith(`${categoryLink}/`))
      .map(link => link.href);
  }, categoryLink);

  console.log('Found links:', postLinks);
  await browser.close();
  return postLinks;
}

async function scrapeAllArticles(categoryLink, categoryName) {
  console.log(`Scraping all articles from category: ${categoryName}`);
  const links = await scrapeArticleLinks(categoryLink);
  const allArticlesData = {};
  const articlesDates = {};
  for (const link of links) {
    try {
      const articleData = await scrapeBlogArticle(link);
      for (const recommendedArticle of articleData.recommendedArticles) {
        if (!articlesDates[recommendedArticle.title]) {
          articlesDates[recommendedArticle.title] = recommendedArticle.date;
        }
      }
      allArticlesData[articleData.title] = {title: articleData.title, author: articleData.author, category: categoryName, readingTime: articleData.readingTime};
    } catch (error) {
      console.error(`Error scraping article ${link}:`, error);
    }
  }
  for (const article in allArticlesData) {
    allArticlesData[article].publishDate = articlesDates[article] || 'Fecha no disponible';
  }
  return allArticlesData;
}

async function scarpeCategoryTitle(categoryLink) {
  console.log('Scraping category title from link:', categoryLink);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${categoryLink}`, { waitUntil: 'networkidle0', timeout: 0 });

  const title = await page.evaluate(() => {
    return document.querySelector('h1')?.innerText || 'Desconocido';
  });
  await browser.close();
  return title;
}

async function scrapeCategoryLinks() {
  console.log('Scraping category links');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://xepelin.com/blog`, { waitUntil: 'networkidle0', timeout: 0 });

  const categoryLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(btn => btn.innerText.includes('Explorar Categoría'))
      .map(btn => btn.href);
  });

  await browser.close();
  const categories = {};
  for (const categoryLink of categoryLinks) {
    const categoryTitle = await scarpeCategoryTitle(categoryLink);
    categories[categoryTitle.toLowerCase()] = categoryLink;
  }
  return categories;
}

async function scrapeByCategoryName(categoryName) {
  const categories = await scrapeCategoryLinks();
  const categoryLink = categories[categoryName.toLowerCase()];
  return await scrapeAllArticles(categoryLink, categoryName);
}

async function scrapeBlog(){
  const categories = await scrapeCategoryLinks();
  let allPosts = {};
  for (const [categoryName, categoryLink] of Object.entries(categories)) {
    console.log(`Scraping category: ${categoryName}, ${categoryLink}`);
    const categoryPosts = await scrapeAllArticles(categoryLink, categoryName);
    allPosts = {...allPosts, ...categoryPosts};
  }
  return allPosts;
}

async function saveToGoogleSheet(allArticlesData, sheetId, sheetName) {
  const auth = new google.auth.GoogleAuth({
    keyFile: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheetExists = spreadsheet.data.sheets.some(sheet => sheet.properties.title === sheetName);

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        }],
      },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    resource: {
      values: [
        ['Titular', 'Categoría', 'Autor', 'Tiempo de Lectura', 'Fecha de Publicación'],
        ...Object.values(allArticlesData).map(post => [post.title, post.category, post.author, post.readingTime, post.publishDate])
      ]
    }
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}`;
}

module.exports = { scrapeByCategoryName, scrapeBlog, saveToGoogleSheet, scrapeAllArticles };