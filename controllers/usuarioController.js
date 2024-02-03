const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pem = require("pem");
const Usuario = require("../models/Usuario");
const VerificacaoEmail = require("../models/VerificacaoEmail");
const transporter = require("../mailer");
const ResetSenha = require("../models/ResetSenha");
const Rastrear = require("../models/Rastrear");
const htmlTemplate = fs.readFileSync("./static/email.html", "utf-8");
const htmlTemplateRedefinicao = fs.readFileSync("./static/reset.html", "utf-8");

const JWT = require("../models/JWT");

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

    const moment = require("moment-timezone");

    const now = moment().tz("America/Sao_Paulo");

    const rastrear = await Rastrear.create({
      email,
      aberto_em: "naoaberto",
    });

    const link_rastreio = `https://${dominioAtual}/rastrear/${email}`;
    // Envia e-mail de ativação
    const info = await transporter.sendMail({
      from: "suv@viniciusdev.com.br",
      to: email,
      subject: "Ativação de Conta",
      html: htmlTemplate
        .replace(
          "link_ativacao",
          `http://${dominioAtual}/ativar-conta/${token}`
        )
        .replace("link_rastreio", link_rastreio),
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
            expiresIn: "24h",
          }
        );

        // Salva o token no banco de dados
        await JWT.create({
          token,
        });

        console.log("Token gerado:", token);
        console.log("UID:", usuario.uid);
        console.log("Email:", usuario.email);
        console.log("Token decodificado:", jwt.decode(token));

        res.json({
          sucesso: true,
          message: "Login bem-sucedido",
          token,
          email: usuario.email,
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

async function redefinirSenha(req, res) {
  try {
    const { email } = req.body;

    // Verifica se o usuário com o email fornecido existe
    const usuario = await Usuario.findOne({ where: { email } });

    if (usuario) {
      // Gera um token único para a redefinição de senha
      const token = gerarUid();

      // Define a data de expiração (por exemplo, 1 hora a partir de agora)
      const expiracao = new Date(Date.now() + 1 * 60 * 60 * 1000);

      // Cria uma entrada no modelo ResetSenha associada ao usuário
      await ResetSenha.create({
        token,
        userUid: usuario.uid,
        expiresAt: expiracao,
      });

      // Envia um e-mail com o link para a página de redefinição de senha
      const dominioAtual = req.hostname;
      const linkRedefinicao = `http://${dominioAtual}/redefinir-senha/${token}`;

      const info = await transporter.sendMail({
        from: "suv@viniciusdev.com.br",
        to: email,
        subject: "Redefinição de Senha",
        html: htmlTemplateRedefinicao.replace(
          "link_redefinicao",
          linkRedefinicao
        ),
      });

      console.log("E-mail de redefinição de senha enviado:", info);

      res.json({
        sucesso: true,
        message: "Link de redefinição enviado por e-mail.",
      });
    } else {
      res
        .status(404)
        .json({ sucesso: false, message: "Usuário não encontrado." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      sucesso: false,
      message: "Erro ao solicitar redefinição de senha.",
    });
  }
}

module.exports = {
  criarUsuario,
  loginUsuario,
  redefinirSenha,
};
