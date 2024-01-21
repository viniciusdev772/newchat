const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pem = require("pem");
const Usuario = require("../models/Usuario");
const VerificacaoEmail = require("../models/VerificacaoEmail");
const transporter = require("../mailer");

const htmlTemplate = fs.readFileSync("./static/email.html", "utf-8");

// Função para gerar um uid aleatório
function gerarUid() {
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

    // Verifica se o email já está cadastrado
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res
        .status(400)
        .json({ sucesso: false, message: "Este email já está cadastrado." });
    }

    // Cria um uid único para o novo usuário
    const uid = gerarUid();

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Cria o novo usuário
    const novoUsuario = await Usuario.create({
      email,
      senha: senhaCriptografada,
      uid,
      email_verificado: false,
      is_active: false,
    });

    // Cria entrada de verificação de e-mail
    const token = gerarUid();
    const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira em 24 horas
    await VerificacaoEmail.create({
      token,
      email,
      expiracao,
    });

    const dominioAtual = req.hostname;

    // Envia e-mail de ativação
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

    res.status(201).json({ sucesso: true, novoUsuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, message: "Erro ao criar usuário." });
  }
}

async function loginUsuario(req, res) {
  try {
    const { email, senha } = req.body;

    // Busca o usuário pelo email
    const usuario = await Usuario.findOne({
      where: { email },
    });

    if (usuario) {
      // Verifica se a senha fornecida é correta
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      // verifica se o usuario foi banido e então mostra a mensagem de banido
      if (usuario.is_banned == true) {
        return res.status(403).json({
          sucesso: false,
          message: usuario.ban_message,
        });
      }

      if (senhaCorreta && usuario.email_verificado) {
        // Carrega a chave privada do certificado PEM
        const chavePrivadaPem = fs.readFileSync(
          "./protected/privkey.pem",
          "utf-8"
        );

        // Gera um token JWT com informações adicionais e assina com a chave privada do certificado PEM
        const token = jwt.sign(
          {
            uid: usuario.uid,
            email: usuario.email,
            iss: "sistema_de_autenticacao",
            iat: Math.floor(Date.now() / 1000), // data de emissão em segundos
          },
          chavePrivadaPem, // Chave privada do certificado PEM
          {
            algorithm: "ES256", // Algoritmo de assinatura RSA
            expiresIn: "1h",
          }
        );

        console.log("Token gerado:", token);
        console.log("UID:", usuario.uid);
        console.log("Email:", usuario.email);
        console.log("Token decodificado:", jwt.decode(token));

        res.json({
          sucesso: true,
          message: "Login bem-sucedido",
          token,
          uid: usuario.uid,
        });
      } else {
        res.status(401).json({
          sucesso: false,
          message: "Credenciais inválidas ou email não verificado.",
        });
      }
    } else {
      res.status(401).json({
        sucesso: false,
        message: "Credenciais inválidas ou email não verificado.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, message: "Erro ao fazer login." });
  }
}

module.exports = {
  criarUsuario,
  loginUsuario,
};
