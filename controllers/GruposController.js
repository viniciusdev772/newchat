// controllers/novidadeController.js
const Grupo = require("../models/Grupo");
const Participante = require("../models/Participante");
const Usuario = require("../models/Usuario");

async function criarGrupo(req, res) {
  try {
    const { nomeGrupo, descricao, quantidadePessoas, adicionarTodos } =
      req.body;

    const novoGrupo = await Grupo.create({
      nomeGrupo,
      descricao,
      quantidadePessoas,
    });

    // Se a opção "Adicionar todos os usuários" estiver marcada
    if (adicionarTodos) {
      // Obtenha todos os usuários do model
      const todosUsuarios = await Usuario.findAll();

      // Adicione cada usuário ao grupo
      for (const usuario of todosUsuarios) {
        const participante = await Participante.create({
          email: usuario.email,
        });

        await novoGrupo.addParticipante(participante);
      }
    } else {
      // Adicionando o primeiro participante (vinil600@gmail.com) se a opção não estiver marcada
      const participante = await Participante.create({
        email: "vinil600@gmail.com",
      });

      await novoGrupo.addParticipante(participante);
    }

    res.json(novoGrupo);
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    res.status(500).json({ error: "Erro ao criar grupo." });
  }
}

async function listarGrupos(req, res) {
  try {
    const emailRequisicao = req.email; // Assumindo que o email está no parâmetro da consulta

    const grupos = await Grupo.findAll({
      include: [
        {
          model: Participante,
          as: "participantes",
          attributes: ["email"],
        },
      ],
    });

    // Filtrar grupos pelos participantes que têm o email da requisição
    const gruposFiltrados = grupos.filter((grupo) =>
      grupo.participantes.some(
        (participante) => participante.email === emailRequisicao
      )
    );

    res.json(gruposFiltrados);
  } catch (error) {
    console.error("Erro ao listar grupos:", error);
    res.status(500).json({ error: "Erro ao listar grupos." });
  }
}

module.exports = {
  criarGrupo,
  listarGrupos,
};
