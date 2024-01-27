const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

// Defina o modelo para a tabela "mensagens_lidas"
const Lidas = sequelize.define("mensagens_lidas", {
  uid_msg: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
  },
  uid_user: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

// Exporte o modelo para poder usá-lo em outras partes da sua aplicação
module.exports = Lidas;
