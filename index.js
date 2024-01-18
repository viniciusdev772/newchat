// index.js

const express = require("express");
const sequelize = require("./sequelize");
const usuarioController = require("./controllers/usuarioController");
const VerificacaoEmail = require("./models/VerificacaoEmail");
const Usuario = require("./models/Usuario");
const Novidade = require("./models/Novidade");
const app = express();
const PORT = 3000;

const novidadeController = require("./controllers/novidadeController");

sequelize.sync().then(() => {
  console.log("Banco de dados sincronizado.");
});

app.use(express.json());

//decode
app.use(express.urlencoded({ extended: true }));

//usar pasta static
app.use(express.static("static"));

// Rota para criar usuário
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
      const { email } = verificacaoEmail; // Obtemos o email associado ao token

      // Atualizamos a coluna email_verificado no modelo Usuario
      await Usuario.update({ email_verificado: true }, { where: { email } });

      //exclui o token
      await VerificacaoEmail.destroy({ where: { token } });

      return res.send("Conta ativada com sucesso.");
    }

    return res.status(404).send("Token de verificação inválido ou expirado.");
  } catch (error) {
    console.error("Erro ao ativar conta:", error);
    res.status(500).send("Erro ao ativar conta.");
  }
});

app.get("/novidades", async (req, res) => {
  try {
    const novidades = await Novidade.findAll();
    res.json(novidades);
  } catch (error) {
    console.error("Erro ao obter novidades:", error);
    res.status(500).json({ error: "Erro ao obter novidades." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
