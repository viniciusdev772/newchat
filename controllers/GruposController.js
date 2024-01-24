// controllers/novidadeController.js
const Grupo = require("../models/Grupo");
const Participante = require("../models/Participante");

async function criarGrupo(req, res) {
  try {
    const { nomeGrupo, descricao, quantidadePessoas } = req.body;

    // Adicionando o primeiro participante (vinil600@gmail.com)
    const participante = await Participante.create({ email: 'vinil600@gmail.com' });

    const novoGrupo = await Grupo.create({
      nomeGrupo,
      descricao,
      quantidadePessoas,
    });

    // Associando o participante ao grupo
    await novoGrupo.addParticipante(participante);

    res.json(novoGrupo);
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    res.status(500).json({ error: "Erro ao criar grupo." });
  }
}


async function listarGrupos(req, res) {
  try {
    const grupos = await Grupo.findAll({
      include: [{
        model: Participante,
        as: 'participantes',
        attributes: ['email'],
      }],
    });

    res.json(grupos);
  } catch (error) {
    console.error("Erro ao listar grupos:", error);
    res.status(500).json({ error: "Erro ao listar grupos." });
  }
}

module.exports = {
  criarGrupo,
  listarGrupos,
};