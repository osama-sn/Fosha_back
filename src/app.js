const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const langMiddleware = require('./middlewares/langMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const setupSwagger = require('./config/swagger');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// i18n Localization Middleware
app.use(langMiddleware);

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API Documentation
setupSwagger(app);

// Routes
app.use('/api/v1', routes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
