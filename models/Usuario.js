// models/Usuario.js

const Sequelize = require("sequelize");
const sequelize = require("../sequelize");
const VerificacaoEmail = require("./VerificacaoEmail");

const Usuario = sequelize.define("usuario", {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  senha: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  uid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ban_message: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email_verificado: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  is_banned: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});

// Relação com o modelo VerificacaoEmail
Usuario.hasOne(VerificacaoEmail, { foreignKey: "email", sourceKey: "email" });

module.exports = Usuario;
