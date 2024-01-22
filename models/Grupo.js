const Sequelize = require("sequelize");
const { v4: uuidv4 } = require('uuid');
const sequelize = require("../sequelize");
const Participante = require("./Participante");

const Grupo = sequelize.define('Grupo', {
    uid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    nomeGrupo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    descricao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    quantidadePessoas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 10
        }
    },
});

// Relacionamento entre Grupo e Participante
Grupo.hasMany(Participante, { as: 'participantes' });

module.exports = Grupo;
