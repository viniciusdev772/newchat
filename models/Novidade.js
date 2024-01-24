// models/Novidade.js

const Sequelize = require("sequelize");
const sequelize = require("../sequelize");
const moment = require("moment-timezone");

const Novidade = sequelize.define("novidade", {
  titulo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  hora: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: () => moment().tz("America/Sao_Paulo").format(), // Obtém a hora certa em Brasília
  },
  uid: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  corpo: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  link: {
    type: Sequelize.STRING,
    allowNull: true, // Pode ser opcional, dependendo do seu caso
  },
});

module.exports = Novidade;
