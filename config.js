// Arquivo de configuração PM2

module.exports = {
  apps: [
    {
      name: "nome-do-app", // Substitua pelo nome da sua aplicação
      script: "index.js", // Substitua pelo caminho real do seu arquivo de entrada
      watch: true, // Reinicie o aplicativo em caso de alterações nos arquivos
      ignore_watch: ["node_modules", "logs"], // Pastas a serem ignoradas pelo watch
      instances: "max", // Número de instâncias a serem executadas
      exec_mode: "cluster",
      autorestart: true, // Reinicie automaticamente em caso de falha
      max_memory_restart: "1G", // Reinicie se o uso de memória exceder este valor
      env: {
        NODE_ENV: "production", // Ambiente de execução (produção, desenvolvimento, etc.)
        PORT: 3001, // Porta na qual o aplicativo será executado
      },
      log_date_format: "YYYY-MM-DD HH:mm Z", // Formato de data para os registros
      out_file: "logs/out.log", // Caminho para o arquivo de saída
      error_file: "logs/error.log", // Caminho para o arquivo de erros
    },
  ],
};
