const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const Chamados = sequelize.define("Chamados", {
  email: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  solicitacao: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  codigo: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING(255),
    defaultValue: "pendente",
  },
});

module.exports = Chamados;
