const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const audit = require('express-requests-logger');
const apiRoutes = require('./src/routes/api');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(audit(), bodyParser.json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Usar rutas API separadas
app.use('/', apiRoutes);

// Servir archivos estáticos del frontend
app.use(express.static('public'));

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
