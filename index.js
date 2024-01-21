// index.js

const express = require("express");
const sequelize = require("./sequelize");
const usuarioController = require("./controllers/usuarioController");
const VerificacaoEmail = require("./models/VerificacaoEmail");
const Usuario = require("./models/Usuario");
const Novidade = require("./models/Novidade");
const Mensagem = require("./models/Mensagem");
const app = express();
const PORT = 3001;

const cors = require("cors");

const WebSocket = require("ws");

const http = require("http");

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.server = server;

app.use(cors());

const novidadeController = require("./controllers/novidadeController");

sequelize.sync().then(() => {
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

app.get("/check_jwt", checker);

app.get("/novidades", verificarToken, async (req, res) => {
  try {
    const novidades = await Novidade.findAll();
    res.json(novidades);
  } catch (error) {
    console.error("Erro ao obter novidades:", error);
    res.status(500).json({ error: "Erro ao obter novidades." });
  }
});

wss.on("headers", (headers, request) => {
  headers.push("Access-Control-Allow-Origin: *"); // Ou ajuste para a origem desejada
});

wss.on("connection", (ws) => {
  Mensagem.findAll().then((mensagens) => {
    ws.send(JSON.stringify(mensagens));
  });

  ws.on("message", async (message) => {
    const mensagemData = JSON.parse(message);
    await Mensagem.create(mensagemData);

    // Envie mensagem para todos os clientes conectados, incluindo o remetente
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(mensagemData));
      }
    });
  });
});

// Alteração aqui: Use o servidor criado com WebSocket para ouvir em vez do app.listen
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
