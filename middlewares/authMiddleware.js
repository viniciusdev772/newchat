const jwt = require("jsonwebtoken");
const fs = require("fs");

function verificarToken(req, res, next) {
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
      (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Token inválido." });
        }

        // Adiciona o UID decodificado à requisição para uso posterior
        req.uid = decoded.uid;
        next();
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao verificar o token." });
  }
}

module.exports = {
  verificarToken,
};
