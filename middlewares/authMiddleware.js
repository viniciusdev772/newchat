const jwt = require("jsonwebtoken");
const fs = require("fs");
const Usuario = require("../models/Usuario");

async function verificarToken(req, res, next) {
  // Obtém o token do cabeçalho da requisição
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  try {
    // Carrega a chave pública do certificado PEM
    const chavePublicaPem = fs.readFileSync("./protected/privkey.pem", "utf-8");

    // Verifica e decodifica o token usando a chave pública
    jwt.verify(
      token,
      chavePublicaPem,
      { algorithms: ["ES256"] },
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Token inválido." });
        }

        // Verifica se o UID está no banco de dados
        try {
          const usuario = await Usuario.findOne({ uid: decoded.uid });

          if (!usuario) {
            return res
              .status(403)
              .json({ valid : false, message: "UID não encontrado no banco de dados." });
          }

          // Adiciona o UID decodificado à requisição para uso posterior
          req.uid = decoded.uid;
          req.email = decoded.email;
          next();
        } catch (error) {
          console.error(error);
          return res
            .status(500)
            .json({ message: "Erro ao verificar o UID no banco de dados." });
        }
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao verificar o token." });
  }
}



async function checker(req, res, next) {
  // Obtém o token do cabeçalho da requisição
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  try {
    // Carrega a chave pública do certificado PEM
    const chavePublicaPem = fs.readFileSync("./protected/privkey.pem", "utf-8");

    // Verifica e decodifica o token usando a chave pública
    jwt.verify(
      token,
      chavePublicaPem,
      { algorithms: ["ES256"] },
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ valid : false, message: "Token inválido." });
        }

        // Verifica se o UID está no banco de dados
        try {
          const usuario = await Usuario.findOne({ uid: decoded.uid });

          if (!usuario) {
            return res
              .status(403)
              .json({ valid : false, message: "UID não encontrado no banco de dados." });
          }else{
            return res
              .status(200)
              .json({ valid : true, message: "UID encontrado no banco de dados." });
          }

          // Adiciona o UID decodificado à requisição para uso posterior
          req.uid = decoded.uid;
          next();
        } catch (error) {
          console.error(error);
          return res
            .status(500)
            .json({ valid : false, message: "Erro ao verificar o UID no banco de dados." });
        }
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ valid : false, message: "Erro ao verificar o token." });
  }
}

module.exports = {
  verificarToken,
  checker
};
