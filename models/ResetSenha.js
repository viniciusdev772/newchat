// models/ResetSenha.js

const Sequelize = require("sequelize");
const sequelize = require("../sequelize");


const ResetSenha = sequelize.define("ResetSenha", {
  token: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  userUid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});



// Exporte o modelo para ser utilizado em outras partes do seu código
module.exports = ResetSenha;
