const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  // Obtém o token do cabeçalho da requisição
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  // Verifica e decodifica o token
  jwt.verify(token, "BPLx8mSebZAwxe6bIy5Uz3TkW3xE3rqX", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido." });
    }

    // Adiciona o UID decodificado à requisição para uso posterior
    req.uid = decoded.uid;
    next();
  });
}

module.exports = {
  verificarToken,
};
