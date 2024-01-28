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
const VistoPorUltimo = require("./models/VistoPorUltimo");
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

// Import the necessary module.
const moment = require("moment-timezone");

// Get the current time in Brasília.
const now = moment().tz("America/Sao_Paulo");

// Format the time in milliseconds.
const ms = now.valueOf();

// Log the time to the console.
console.log(`The current time in Brasília in milliseconds is: ${ms}`);

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

  const ms = now.valueOf();

  ws.on("close", () => {
    console.log("Usuario de uid CLose " + uid + " desconectou. ");
    VistoPorUltimo.deleteMany({ uid: uid }, (err) => {
      if (err) {
        console.error("Erro ao excluir registros antigos:", err);
        return;
      }

      // Salvando o novo registro diretamente
      VistoPorUltimo.create(
        {
          uid: uid,
          hora: ms,
        },
        (err) => {
          if (err) {
            console.error("Erro ao salvar o novo registro:", err);
          } else {
            console.log("Registro visto por último criado com sucesso.");
          }
        }
      );
    });
  });
  ws.on("disconnect", () => {
    console.log("Usuario de uid Disconnect " + uid + " desconectou. ");

    VistoPorUltimo.deleteMany({ uid: uid }, (err) => {
      if (err) {
        console.error("Erro ao excluir registros antigos:", err);
        return;
      }

      // Salvando o novo registro diretamente
      VistoPorUltimo.create(
        {
          uid: uid,
          hora: ms,
        },
        (err) => {
          if (err) {
            console.error("Erro ao salvar o novo registro:", err);
          } else {
            console.log("Registro visto por último criado com sucesso.");
          }
        }
      );
    });
  });

  try {
    const mensagen4s = await Mensagem.findAll({
      where: { sala: grupo },
      order: [["createdAt", "DESC"]],
    });

    if (mensagen4s.length > 0) {
      ws.send(JSON.stringify(mensagen4s));
      for (const mensagem of mensagen4s) {
        // Verificar se o usuário já leu a mensagem
        const mensagemLida = await Lidas.findOne({
          where: { uid_msg: mensagem.uid_msg, uid_user: uid },
        });

        if (!mensagemLida) {
          // Se o usuário ainda não leu a mensagem, marca como lida
          await Lidas.create({
            uid_msg: mensagem.uid_msg,
            uid_user: uid,
          });
        }

        const todosUsuarios = await Usuario.findAll({
          attributes: ["uid"],
        });

        const uidsUsuarios = todosUsuarios.map((usuario) => usuario.uid);

        // Obter todos os UIDs dos usuários que não viram esta mensagem
        const uidsUsuariosLidos = (
          await Lidas.findAll({
            attributes: ["uid_user"],
            where: { uid_user: { [Sequelize.Op.in]: uidsUsuarios } },
          })
        ).map((lida) => lida.uid_user);

        // Obter os UIDs dos usuários que ainda não leram nenhuma mensagem
        const uidsUsuariosNaoLidos = uidsUsuarios.filter(
          (uid) => !uidsUsuariosLidos.includes(uid)
        );

        console.log("Mensagens não lidas pelos usuários:");

        // Obter as mensagens que esses usuários não visualizaram
        const mensagensNaoVistas = await Mensagem.findAll({
          attributes: ["uid_msg", "uid_sender"],
          where: { uid_msg: { [Sequelize.Op.notIn]: uidsUsuariosLidos } },
        });

        mensagensNaoVistas.forEach((mensagem) => {
          uidsUsuariosNaoLidos.forEach((uidUsuario) => {
            console.log(
              `Usuario ${uidUsuario} não leu a mensagem ${mensagem.uid_msg}`
            );
          });
        });
      }

      const mensagens = await Mensagem.findAll({
        where: { sala: grupo },
        order: [["createdAt", "DESC"]],
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
