const express = require("express");
const sequelize = require("./sequelize");
const usuarioController = require("./controllers/usuarioController");
const VerificacaoEmail = require("./models/VerificacaoEmail");
const Usuario = require("./models/Usuario");
const Novidade = require("./models/Novidade");
const Mensagem = require("./models/Mensagem");
const Grupo = require("./models/Grupo");
const Participante = require("./models/Participante");
const grupoController = require("./controllers/GruposController");
const ResetSenha = require("./models/ResetSenha");
const Lidas = require("./models/Lidas");
const app = express();
const PORT = 3001;

const Sequelize = require("sequelize");

const cors = require("cors");

const WebSocket = require("ws");

const http = require("http");

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.server = server;

app.use(cors());

const novidadeController = require("./controllers/novidadeController");

sequelize.sync({ force: false }).then(() => {
  console.log("Banco de dados sincronizado.");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

const ejs = require("ejs");
app.set("view engine", "ejs");

const { verificarToken, checker } = require("./middlewares/authMiddleware");

app.post("/usuarios/novo", usuarioController.criarUsuario);
app.post("/usuarios/login", usuarioController.loginUsuario);
app.post("/novidades", novidadeController.postarNovidade);
app.post("/grupo/create", grupoController.criarGrupo);
app.post("/grupo/list", verificarToken, grupoController.listarGrupos);
app.post("/reset-senha", usuarioController.redefinirSenha);

app.get("/ativar-conta/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const verificacaoEmail = await VerificacaoEmail.findOne({
      where: { token },
    });

    if (verificacaoEmail) {
      const { email } = verificacaoEmail;
      await Usuario.update({ email_verificado: true }, { where: { email } });
      await VerificacaoEmail.destroy({ where: { token } });
      return res.sendFile(__dirname + "/static/verificado.html");
    }

    return res.sendFile(__dirname + "/static/erro.html");
  } catch (error) {
    console.error("Erro ao ativar conta:", error);
    res.status(500).send("Erro ao ativar conta.");
  }
});

app.get("/redefinir-senha/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar a entrada no modelo ResetSenha com base no token
    const resetSenhaEntry = await ResetSenha.findOne({
      where: { token },
    });

    if (!resetSenhaEntry) {
      return res
        .status(404)
        .json({ sucesso: false, message: "Token inválido." });
    }

    // Verificar se o token ainda é válido (não expirou)
    const agora = new Date();
    if (agora > resetSenhaEntry.expiresAt) {
      return res
        .status(401)
        .json({ sucesso: false, message: "Token expirado." });
    }

    // Renderizar a página HTML de redefinição de senha (pode ser uma página com um formulário)
    res.sendFile(__dirname + "/static/pagina-de-redefinicao-de-senha.html");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ sucesso: false, message: "Erro ao processar a solicitação." });
  }
});

app.get("/check_jwt", checker);

app.post("/api/redefinir-senha/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { novaSenha } = req.body;

    // Buscar a entrada no modelo ResetSenha com base no token
    const resetSenhaEntry = await ResetSenha.findOne({
      where: { token },
    });

    if (!resetSenhaEntry || resetSenhaEntry.expiresAt < new Date()) {
      return res
        .status(401)
        .json({ sucesso: false, message: "Token inválido ou expirado." });
    }

    //resetSenhaEntry.userUid
    // Atualizar a senha do usuário
    const usuario = await Usuario.findOne(
      { where: { uid: resetSenhaEntry.userUid } },
      { raw: true }
    );

    if (!usuario) {
      return res
        .status(404)
        .json({ sucesso: false, message: "Usuário não encontrado." });
    }

    // Criptografar a nova senha antes de salvar

    novaSenha = await bcrypt.hash(novaSenha, 10);

    const senhaCriptografada = novaSenha;

    await usuario.update({ senha: senhaCriptografada });

    // Remover a entrada de reset de senha, pois não é mais necessária
    await resetSenhaEntry.destroy();

    res.json({ sucesso: true, message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir a senha:", error);
    res.status(500).json({
      sucesso: false,
      message: "Erro ao redefinir a senha. Tente novamente mais tarde.",
    });
  }
});

app.get("/novidades", verificarToken, async (req, res) => {
  try {
    const novidades = await Novidade.findAll();
    res.json(novidades);
  } catch (error) {
    console.error("Erro ao obter novidades:", error);
    res.status(500).json({ error: "Erro ao obter novidades." });
  }
});

const MensagemData = {
  sala: "", // Adicione o valor apropriado para a sala
  conteudo: "",
  uid_sender: "",
  email_sender: "",
  hora: 0,
};
wss.on("connection", async (ws, req) => {
  const grupo = req.headers["grupo"];
  const uid = req.headers["uid"];

  try {
    const mensagens = await Mensagem.findAll({
      where: { sala: grupo },
      order: [["createdAt", "DESC"]],
    });

    if (mensagens.length > 0) {
      mensagens.forEach(async (mensagem4) => {
        //antes de chamar metodo Lida.create, verificar se o usuario ja leu a mensagem

        Lidas.findAll({
          where: { uid_msg: mensagem4.uid_msg, uid_user: uid },
        }).then((lida) => {
          if (lida.length === 0) {
            Lidas.create({
              uid_msg: mensagem4.uid_msg,
              uid_user: uid,
            });
          }
        });

        const todosUidsUsuarios = await Usuario.findAll({
          attributes: ["uid"],
        });

        const uidsUsuarios = todosUidsUsuarios.map((usuario) => usuario.uid);

        const mensagensLidas = await Lidas.findAll({
          where: { uid_user: { [Sequelize.Op.in]: uidsUsuarios } },
          attributes: ["uid_msg"],
        });

        mensagens.forEach((mensagem) => {
          const usuariosLidos = mensagensLidas
            .filter((lida) => lida.uid_msg === mensagem.uid_msg)
            .map((lida) => lida.uid_user);

          const usuariosNaoLidos = uidsUsuarios.filter(
            (uid) => !usuariosLidos.includes(uid)
          );
          console.log("mensagem.uid_msg", mensagem.uid_msg);
          console.log(usuariosNaoLidos);
        });
      });
      ws.send(JSON.stringify(mensagens));
    }
    ws.on("message", async (message) => {
      try {
        const mensagemData = { ...MensagemData, ...JSON.parse(message) };
        mensagemData.hora = Date.now();

        await Mensagem.create({
          sala: mensagemData.sala,
          conteudo: mensagemData.conteudo,
          uid_sender: mensagemData.uid_sender,
          email_sender: mensagemData.email_sender,
          hora: mensagemData.hora,
        });

        // Obtém e envia mensagens atualizadas para todos os clientes no mesmo grupo
        const mensagensAtualizadas = await Mensagem.findAll({
          where: { sala: grupo },
          order: [["createdAt", "DESC"]],
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(mensagensAtualizadas));
          }
        });
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error("Erro ao obter mensagens:", error);
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
