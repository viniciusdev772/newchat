// models/Participante.js
const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const Participante = sequelize.define('Participante', {
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = Participante;
