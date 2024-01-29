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
const Chamados = require("./models/Chamados");
const app = express();
const PORT = 3001;
const path = require("path");

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
app.set("views", path.join(__dirname, "views"));

const { verificarToken, checker } = require("./middlewares/authMiddleware");

app.post("/usuarios/novo", usuarioController.criarUsuario);
app.post("/usuarios/login", usuarioController.loginUsuario);
app.post("/novidades", novidadeController.postarNovidade);
app.post("/grupo/create", grupoController.criarGrupo);
app.post("/grupo/list", verificarToken, grupoController.listarGrupos);
app.post("/reset-senha", usuarioController.redefinirSenha);

const transporter = require("./mailer");
function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/chamados_aprove", async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).send(`
        <div class="bg-red-200 border-red-600 text-red-600 border-l-4 p-4 mb-4" role="alert">
          <p class="font-bold">Erro!</p>
          <p>O código não foi recebido.</p>
        </div>
      `);
    }

    const chamado = await VerificarCodigo(codigo);

    if (chamado) {
      const tipoSolicitacao =
        chamado.solicitacao === "unban"
          ? "Solicitação de desbanimento de conta"
          : chamado.solicitacao === "delete"
          ? "Solicitação de exclusão de conta"
          : "";

      // Atualize o status do chamado para "aprovada"
      chamado.status = "aprovada";
      await chamado.save();

      // Atualize a lógica de retorno conforme necessário

      return res.status(200).send(`
        <div class="bg-green-200 border-green-600 text-green-600 border-l-4 p-4 mb-4" role="alert">
          <p class="font-bold">Sucesso!</p>
          <p>A solicitação foi aprovada com sucesso.</p>
          <p>Tipo de solicitação: ${tipoSolicitacao}</p>
        </div>
      `);
    } else {
      // O código não corresponde na tabela "Chamado"
      return res.status(200).send(`
        <div class="bg-red-200 border-red-600 text-red-600 border-l-4 p-4 mb-4" role="alert">
          <p class="font-bold">Erro!</p>
          <p>Código inválido.</p>
        </div>
      `);
    }
  } catch (error) {
    // Exibir o erro detalhado
    console.error(error);
    return res.status(200).send(`
      <div class="bg-red-200 border-red-600 text-red-600 border-l-4 p-4 mb-4" role="alert">
        <p class="font-bold">Erro!</p>
        <p>Ocorreu um erro ao verificar o código: ${error.message}</p>
      </div>
    `);
  }
});

// Dentro do seu arquivo de rotas
app.get("/get_chamados", async (req, res) => {
  try {
    const chamados = await Chamados.findAll();
    res.render("chamados", { chamados });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro interno do servidor");
  }
});

app.post("/apagar-usuario", async (req, res) => {
  const { email, authorization } = req.body;

  if (authorization !== "123456") return res.status(200).send("Não autorizado");

  // Verificar se o usuário existe
  const usuario = await Usuario.findOne({
    where: { email },
  });

  if (!usuario) {
    return res.status(200).send("Usuário não encontrado");
  } else {
    await usuario.destroy();

    //obter uid do usuario
    const uid = usuario.uid;

    Mensagem.destroy({
      where: {
        email_sender: email,
      },
    })
      .then(() => {
        console.log("Mensagens do usuario deletadas com sucesso");
      })
      .catch((err) => {
        console.error("Erro ao deletar mensagens do usuario:", err);
      });

    Participante.destroy({
      where: {
        email: email,
      },
    })
      .then(() => {
        console.log("Participante deletado com sucesso");
      })
      .catch((err) => {
        console.error("Erro ao deletar mensagens do usuario:", err);
      });

    Lidas.destroy({
      where: {
        uid_user: uid,
      },
    })
      .then(() => {
        console.log("Mensagens do usuario deletadas com sucesso");
      })
      .catch((err) => {
        console.error("Erro ao deletar mensagens do usuario:", err);
      });
    Participante.destroy({
      where: {
        email: email,
      },
    })
      .then(() => {
        console.log("Participante deletado com sucesso");
      })
      .catch((err) => {
        console.error("Erro ao deletar mensagens do usuario:", err);
      });
    return res.status(200).send("Usuário deletado com sucesso");
  }
});
async function VerificarCodigo(codigo) {
  try {
    // Verifica se o código corresponde na tabela "Chamado"
    const chamado = await Chamados.findOne({
      where: {
        codigo,
        status: "pendente",
      },
    });

    return chamado;
  } catch (error) {
    throw error;
  }
}

app.post("/chamado", async (req, res) => {
  try {
    const { email, requestType } = req.body;

    const existingUser = await Usuario.findOne({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return res.status(200).send(`
        <div class="bg-red-200 border-red-600 text-red-600 border-l-4 p-4 mb-4" role="alert">
          <p class="font-bold">Erro!</p>
          <p>O email fornecido não está registrado.</p>
        </div>
      `);
    }

    const existingChamado = await Chamados.findOne({
      where: {
        email,
      },
    });

    if (existingChamado) {
      return res.status(200).send(`
        <div class="bg-red-200 border-red-600 text-red-600 border-l-4 p-4 mb-4" role="alert">
          <p class="font-bold">Erro!</p>
          <p>Este email já possui uma solicitação em aberto, atualizações são enviadas ao email.</p>
        </div>
      `);
    }

    // Se não houver um chamado pendente e o email existir, continue com o restante do código

    const novoCodigo = generateRandomCode();
    const novoChamado = await Chamados.create({
      email,
      solicitacao: requestType, // Substitua isso pelo campo real correspondente ao tipo de solicitação
      codigo: novoCodigo,
      status: "pendente",
    });

    const link = `https://chat.viniciusdev.com.br/request.html?codigo=${novoCodigo}`;

    const info = await transporter.sendMail({
      from: "suv@viniciusdev.com.br",
      to: email,
      subject: "chamado Update",
      text: `
        Sucesso!
        Sua solicitação foi registrada com sucesso. Um código de confirmação foi enviado para o seu e-mail.

        Verifique sua caixa de entrada e spam para encontrar o e-mail contendo o código de confirmação.
        O código de confirmação é necessário para validar que a solicitação foi feita por você.

        Clique no link a seguir para confirmar seu chamado:
        ${link}
      `,
    });

    // ... Seu código para criar um novo chamado ou realizar outras ações

    return res.status(200).send(`
    <div class="bg-green-200 border-green-600 text-green-600 border-l-4 p-4 mb-4" role="alert">
      <p class="font-bold">Sucesso!</p>
                                <p>Sua solicitação foi registrada com sucesso. Um código de confirmação foi enviado para o seu e-mail.</p>
                                <p>Verifique sua caixa de entrada e spam para encontrar o e-mail contendo o código de confirmação.</p>
                                <p>O código de confirmação é necessário para validar que a solicitação foi feita por você.</p>
                            </div>
  `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro interno do servidor");
  }
});

app.get("/", async (req, res) => {
  res.send("SERVER OK");
});

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

  VistoPorUltimo.destroy({
    where: {
      uid: uid,
    },
  })
    .then(() => {
      return VistoPorUltimo.create({
        uid: uid,
        hora: "online",
      });
    })
    .then(() => {
      console.log("Registro visto por último criado com sucesso.");
    })
    .catch((err) => {
      console.error("Erro ao excluir ou criar registros:", err);
    });

  ws.on("close", () => {
    const now = moment().tz("America/Sao_Paulo");
    console.log("Usuario de uid CLose " + uid + " desconectou. ");
    VistoPorUltimo.destroy({
      where: {
        uid: uid,
      },
    })
      .then(() => {
        return VistoPorUltimo.create({
          uid: uid,
          hora: now.valueOf(),
        });
      })
      .then(() => {
        console.log("Registro visto por último criado com sucesso.");
      })
      .catch((err) => {
        console.error("Erro ao excluir ou criar registros:", err);
      });
  });
  ws.on("disconnect", () => {
    const now = moment().tz("America/Sao_Paulo");
    console.log("Usuario de uid Disconnect " + uid + " desconectou. ");

    VistoPorUltimo.destroy({
      where: {
        uid: uid,
      },
    })
      .then(() => {
        return VistoPorUltimo.create({
          uid: uid,
          hora: now.valueOf(),
        });
      })
      .then(() => {
        console.log("Registro visto por último criado com sucesso.");
      })
      .catch((err) => {
        console.error("Erro ao excluir ou criar registros:", err);
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
