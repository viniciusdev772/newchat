const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Mensagem = sequelize.define("Mensagem", {
  uid_msg: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  sala: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conteudo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  uid_sender: {
    type: Sequelize.UUID,
    allowNull: false,
    // Adicione mais opções conforme necessário
  },
  email_sender: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  hora: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  // Adicione mais campos conforme necessário
});

// Adicione associações ou qualquer lógica adicional aqui

module.exports = Mensagem;
