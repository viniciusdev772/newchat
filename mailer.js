// mailer.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.viniciusdev.com.br",
  port: 587,
  secure: false, // true para SSL, false para outros
  auth: {
    user: "suv@viniciusdev.com.br",
    pass: "9778", // Substitua com sua senha ou use variáveis de ambiente
  },
});

module.exports = transporter;
