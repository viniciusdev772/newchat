// sequelize.js

const Sequelize = require('sequelize');

const sequelize = new Sequelize('webchat', 'webchat', 'webchat', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
