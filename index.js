// index.js

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
app.post("/grupo/create", grupoController.criarGrupo);
app.post("/grupo/list",checker ,grupoController.listarGrupos);

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

// Remova a configuração do evento "headers" aqui, pois não é necessário para WebSocket

const MensagemData = {
  conteudo: "",
  uid_sender: "",
  email_sender: "",
  hora: 0, // Timestamp
};

wss.on("connection", (ws) => {
  Mensagem.findAll().then((mensagens) => {
    ws.send(JSON.stringify(mensagens));
  });

  ws.on("message", async (message) => {
    try {
      // Verifique se a mensagem recebida está no formato correto
      const mensagemData = Object.assign({}, MensagemData, JSON.parse(message));

      // Adicione a data de recebimento à mensagem
      mensagemData.hora = Date.now();

      // Registre a mensagem no banco de dados
      await Mensagem.create(mensagemData);

      // Envie mensagem para todos os clientes conectados, incluindo o remetente
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(mensagemData));
        }
      });
    } catch (error) {
      console.error("Erro ao processar a mensagem:", error);
      // Trate o erro conforme necessário
    }
  });
});
// Alteração aqui: Use o servidor criado com WebSocket para ouvir em vez do app.listen
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
