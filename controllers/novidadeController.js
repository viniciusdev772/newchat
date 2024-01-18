// controllers/novidadeController.js

const Novidade = require("../models/Novidade");

function gerarUid() {
  // Função para gerar um uid aleatório
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uid = "";
  for (let i = 0; i < 20; i++) {
    uid += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return uid;
}

async function postarNovidade(req, res) {
  try {
    const { titulo, corpo, link } = req.body;
    const uid = gerarUid(); // Certifique-se de ter uma função geradora de UID

    const novaNovidade = await Novidade.create({
      titulo,
      uid,
      corpo,
      link,
    });

    res.json(novaNovidade);
  } catch (error) {
    console.error("Erro ao postar novidade:", error);
    res.status(500).json({ error: "Erro ao postar novidade." });
  }
}

module.exports = {
  postarNovidade,
};
