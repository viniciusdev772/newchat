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

const JWT = require("./models/JWT");

const Rastrear = require("./models/Rastrear");

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

app.get("/rastrear/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const rastrear = await Rastrear.findOne({
      where: { email },
    });

    // Verifica se o registro foi encontrado antes de tentar atualizá-lo
    if (rastrear) {
      const now = moment().tz("America/Sao_Paulo");

      rastrear.aberto_em = now.valueOf(); // Certifique-se de converter o momento para um objeto Date
      await rastrear.save();
      res.send("Rastreamento atualizado com sucesso."); // Resposta de sucesso
    } else {
      res.status(404).send("Email não encontrado."); // Caso o e-mail não seja encontrado
    }
  } catch (error) {
    console.error("Erro ao rastrear:", error);
    res.status(500).send(error.message);
  }
});
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

app.post("/desbanir-usuario", async (req, res) => {
  const { email } = req.body;

  // Verificar se o usuário existe
  const usuario = await Usuario.findOne({
    where: { email },
  });

  if (!usuario) {
    return res.status(200).send("Usuário não encontrado");
  } else {
    await usuario.update({ is_banned: false });

    const info = await transporter.sendMail({
      from: "suv@viniciusdev.com.br",
      to: email,
      subject: "Conta Desbanida com sucesso",
      text: `Prezado Usuário, estamos enviando este email para informar que sua conta foi desbanida com sucesso.
       Conta: ${email}
       Conforme solicitado, sua conta foi desbanida com sucesso.

       Etapas que você seguiu para desbanir sua conta:
        1 - Solicitou o desbanimento de sua conta no site. pelo url: https://chat.viniciusdev.com.br/chamados.html
        2 - Recebeu um email com um código de confirmação.
        3 - Confirmou o desbanimento de sua conta. acessando o link do email. validando o código.
        4 - um Admin confirmou sua solicitação.
        o que foi desbanido:
        1 - sua conta
        
      `,
    });
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

    const info = await transporter.sendMail({
      from: "suv@viniciusdev.com.br",
      to: email,
      subject: "Conta Deletada com sucesso",
      text: `
       Prezado Usuário, estamos enviando este email para informar que sua conta foi deletada com sucesso.
       Conta: ${email}
       Conforme solicitado, sua conta foi deletada com sucesso.

       Etapas que você seguiu para deletar sua conta:
        1 - Solicitou a exclusão de sua conta no site. pelo url: https://chat.viniciusdev.com.br/chamados.html
        2 - Recebeu um email com um código de confirmação.
        3 - Confirmou a exclusão de sua conta. acessando o link do email. validando o código.
        4 - um Admin confirmou sua solicitação.
        o que foi deletado:
        1 - sua conta
        2 - suas mensagens
        3 - seus grupos
        4 - suas participações em grupos
        5 - suas mensagens enviadas em grupos
        6 - suas mensagens recebidas em grupos
        7 - suas mensagens lidas
        8 - suas mensagens não lidas
        9 - suas mensagens enviadas
        10 - seus registros de visto por último
      `,
    });

    Chamados.destroy({
      where: {
        email: email,
      },
    })
      .then(() => {
        console.log("Chamados deletados com sucesso");
      })
      .catch((err) => {
        console.error("Erro ao deletar chamados do usuario:", err);
      });

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

const bcrypt = require('bcrypt');

app.post("/api/redefinir-senha/:token", async (req, res) => {
  try {
    const { token } = req.params;
    let { novaSenha } = req.body;

    const resetSenhaEntry = await ResetSenha.findOne({ where: { token } });

    if (!resetSenhaEntry || resetSenhaEntry.expiresAt < new Date()) {
      return res.status(401).json({ sucesso: false, message: "Token inválido ou expirado." });
    }

    const usuario = await Usuario.findOne({ where: { uid: resetSenhaEntry.userUid } });

    if (!usuario) {
      return res.status(404).json({ sucesso: false, message: "Usuário não encontrado." });
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await usuario.update({ senha: senhaCriptografada });

    await resetSenhaEntry.destroy();

    res.json({ sucesso: true, message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir a senha:", error);
    res.status(500).json({ sucesso: false, message: "Erro ao redefinir a senha. Tente novamente mais tarde." });
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
  // const grupo = req.headers["grupo"];
  // const uid = req.headers["uid"];

  //obter dos parametros
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = url.searchParams;

  // Extrair os parâmetros grupo e uid
  const grupo = params.get("grupo");
  const uid = params.get("uid");

  console.log("Grupo: ", grupo);
  console.log("UID: ", uid);

  // Tentando encontrar um registro existente ou criar um novo se não existir
  // Tentando encontrar um registro existente ou criar um novo se não existir
  VistoPorUltimo.findOrCreate({
    where: { uid: uid }, // Critérios de busca baseados no uid
    defaults: {
      // Os valores padrão para a criação do registro, usados apenas se um novo registro for criado
      uid: uid,
      hora: "online", // Definindo a hora como "online" para novos registros
    },
  })
    .then(([vistoPorUltimo, created]) => {
      if (created) {
        console.log(
          `Um novo registro para o uid ${uid} foi criado com o estado 'online'.`
        );
      } else {
        console.log(
          `Um registro para o uid ${uid} já existe e não foi alterado.`
        );
      }
    })
    .catch((erro) => {
      // Capturando e logando qualquer erro que ocorra durante o processo
      console.error(
        `Erro ao encontrar ou criar o visto por último para o uid ${uid}:`,
        erro
      );
    });

  const vist = await VistoPorUltimo.findOne({
    where: { uid: uid },
  });

  console.log("Usuario de uid " + uid + " conectou. ");

  const vistoPorUltimo2 = await VistoPorUltimo.findOne({
    where: { uid: uid },
  });

  vistoPorUltimo2.hora = "online";
  await vistoPorUltimo2.save();

  const ms = now.valueOf();

  // Utilizando uma função assíncrona para lidar com operações de banco de dados
  ws.on("close", async () => {
    try {
      // Buscando o registro de 'VistoPorUltimo' pelo 'uid' de forma assíncrona
      const vistoPorUltimo = await VistoPorUltimo.findOne({
        where: { uid: uid },
      });

      // Checando se o registro foi encontrado antes de tentar atualizá-lo
      if (vistoPorUltimo) {
        // Obtendo o horário atual no fuso horário de São Paulo
        const agora = moment().tz("America/Sao_Paulo").valueOf();

        console.log(`Usuario de uid ${uid} desconectou.`);

        // Atualizando o horário de 'visto por último' para o horário atual
        vistoPorUltimo.hora = agora;
        await vistoPorUltimo.save();
      } else {
        // Caso não encontre um registro, pode-se logar ou tomar outra ação
        console.log(`Nenhum registro encontrado para o uid: ${uid}`);
      }
    } catch (erro) {
      // Capturando e logando qualquer erro que ocorra durante o processo
      console.error(
        `Erro ao atualizar o visto por último para o uid ${uid}:`,
        erro
      );
    }
  });

  // Utilizando uma função assíncrona para lidar com operações de banco de dados
  ws.on("disconnect", async () => {
    try {
      // Buscando o registro de 'VistoPorUltimo' pelo 'uid' de forma assíncrona
      const vistoPorUltimo = await VistoPorUltimo.findOne({
        where: { uid: uid },
      });

      // Checando se o registro foi encontrado antes de tentar atualizá-lo
      if (vistoPorUltimo) {
        // Obtendo o horário atual no fuso horário de São Paulo
        const agora = moment().tz("America/Sao_Paulo").valueOf();

        console.log(`Usuario de uid ${uid} desconectou.`);

        // Atualizando o horário de 'visto por último' para o horário atual
        vistoPorUltimo.hora = agora;
        await vistoPorUltimo.save();
      } else {
        // Caso não encontre um registro, pode-se logar ou tomar outra ação
        console.log(`Nenhum registro encontrado para o uid: ${uid}`);
      }
    } catch (erro) {
      // Capturando e logando qualquer erro que ocorra durante o processo
      console.error(
        `Erro ao atualizar o visto por último para o uid ${uid}:`,
        erro
      );
    }
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
