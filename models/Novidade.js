// models/Novidade.js

const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const Novidade = sequelize.define("novidade", {
  titulo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  hora: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
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
