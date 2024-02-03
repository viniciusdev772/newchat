const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const JWT = sequelize.define("JWT", {
  token: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
});

module.exports = JWT;
