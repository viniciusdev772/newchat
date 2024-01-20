// controllers/usuarioController.js
const fs = require("fs");
const Usuario = require("../models/Usuario");

const VerificacaoEmail = require("../models/VerificacaoEmail");
const transporter = require("../mailer");

const htmlTemplate = fs.readFileSync("./static/email.html", "utf-8");

function gerarUid() {
  // Função para gerar um uid aleatório
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uid = "";
  for (let i = 0; i < 20; i++) {
    uid += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return uid;
}

async function criarUsuario(req, res) {
  try {
    const { email, senha } = req.body;
    const uid = gerarUid();

    const novoUsuario = await Usuario.create({
      email,
      senha,
      uid,
      email_verificado: false,
      is_active: false,
    });

    // Criar entrada de verificação de e-mail
    const token = gerarUid();
    const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira em 24 horas
    await VerificacaoEmail.create({
      token,
      email,
      expiracao,
    });

    const dominioAtual = req.hostname;
    // Envie e-mail de ativação
    const info = await transporter.sendMail({
      from: "suv@viniciusdev.com.br",
      to: email,
      subject: "Ativação de Conta",
      html: htmlTemplate.replace(
        "link_ativacao",
        `http://${dominioAtual}/ativar-conta/${token}`
      ),
    });

    console.log("E-mail de ativação enviado:", info);

    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar usuário." });
  }
}

async function loginUsuario(req, res) {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({
      where: { email, senha, email_verificado: true },
      attributes: { exclude: ["senha"] }, // Exclui a senha dos resultados
    });

    if (usuario) {
      res.json({ message: "Login bem-sucedido", uid: usuario.uid });
    } else {
      res
        .status(401)
        .json({ message: "Credenciais inválidas ou email não verificado." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao fazer login." });
  }
}

module.exports = {
  criarUsuario,
  loginUsuario,
};
