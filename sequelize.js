// sequelize.js

const Sequelize = require('sequelize');

const sequelize = new Sequelize('chat_vdev', 'chat_vdev', 'chat_vdev', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
