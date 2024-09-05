const express = require('express');
const router = express.Router();
const axios = require('axios');
const { saveToGoogleSheet, scrapeByCategoryName, scrapeBlog } = require('../utils/utils');


const users = [
  { username: 'admin', password: '123'}];


router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    req.session.loggedin = true;
    req.session.username = username;
    res.redirect('/dashboard');
  } else {
    res.send('Nombre de usuario o contraseña incorrectos.')
  }
});

router.get('/dashboard', (req, res) => {
  if (req.session.loggedin) {
    res.redirect('/dashboard.html');
  } else {
    res.send('Por favor, inicia sesión para ver esta página.');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('Has cerrado sesión.');
});

router.post('/scrape-by-category-name', async (req, res) => {
  const { category, webhook } = req.body;

  try {
    console.log(category);
    const blogData = await scrapeByCategoryName(category);
    const gsheetLink = await saveToGoogleSheet(blogData, process.env.SHEET_ID, category);
    await axios.post(webhook, {
      email: process.env.EMAIL,
      link: gsheetLink,
    });
    console.log(blogData);
    res.send('Scraping completado y respuesta enviada al webhook.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error en el proceso de scraping o respuesta al webhook.');
  }
});

router.post('/scrape-blog', async (req, res) => {
  const { webhook } = req.body;

  try {
    const blogData = await scrapeBlog();
    const gsheetLink = await saveToGoogleSheet(blogData, process.env.SHEET_ID, 'All Articles of Blog');
    await axios.post(webhook, {
      email: process.env.EMAIL,
      link: gsheetLink,
    });
    console.log(blogData);
    res.send('Scraping completado y respuesta enviada al webhook.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error en el proceso de scraping o respuesta al webhook.');
  }
});

module.exports = router;
