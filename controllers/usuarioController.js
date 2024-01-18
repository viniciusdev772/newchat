// controllers/usuarioController.js

const Usuario = require("../models/Usuario");

const VerificacaoEmail = require("../models/VerificacaoEmail");
const transporter = require("../mailer");

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
      text: `Olá! Clique no seguinte link para ativar sua conta: http://${dominioAtual}/ativar-conta/${token}`,
    });

    console.log("E-mail de ativação enviado:", info);

    res.json(novoUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
}

async function loginUsuario(req, res) {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({
      where: { email, senha, email_verificado: true, is_active: true },
    });

    if (usuario) {
      res.json({ message: "Login bem-sucedido." });
    } else {
      res
        .status(401)
        .json({ error: "Credenciais inválidas ou email não verificado." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao fazer login." });
  }
}

module.exports = {
  criarUsuario,
  loginUsuario,
};
