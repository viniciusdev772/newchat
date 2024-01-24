const moment = require("moment-timezone");

// Middleware para configurar a hora de Brasília
const configurarHoraBrasilia = (req, res, next) => {
  req.horaBrasilia = moment().tz("America/Sao_Paulo");
  next();
};

module.exports = configurarHoraBrasilia;
