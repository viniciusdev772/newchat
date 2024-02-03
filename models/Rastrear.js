const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const Rastrear = sequelize.define("Rastrear", {
  email: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  aberto_em: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
});

module.exports = Rastrear;
