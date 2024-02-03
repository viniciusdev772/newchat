const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const JWT = sequelize.define("JWT", {
  token: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
});

module.exports = JWT;
