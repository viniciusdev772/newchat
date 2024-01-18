// models/VerificacaoEmail.js

const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const VerificacaoEmail = sequelize.define("verificacao_email", {
  token: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  expiracao: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});

module.exports = VerificacaoEmail;
