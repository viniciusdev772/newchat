const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Lidas = sequelize.define("mensagens_lidas", {
  uid_msg: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  uid_user: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Sincronize o modelo com o banco de dados

// Exporte o modelo para poder usá-lo em outras partes da sua aplicação
module.exports = Lidas;
