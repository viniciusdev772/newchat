#!/bin/bash

# Defina o caminho do seu repositório local
caminho_repositorio="/home/chat.viniciusdev.com.br/public_html"

# Navegue até o diretório do repositório
cd $caminho_repositorio

# Verifique se há alterações no repositório remoto
alteracoes=$(git fetch origin master)

if [ "$alteracoes" != "Already up to date." ]; then
    # Se houver alterações, faça git pull para atualizar
    git pull origin master
    echo "Repositório atualizado com sucesso!"

    # Instale as dependências com npm install
    npm install

    # Inicie o aplicativo com npm start
    npm start
else
    echo "Nenhuma alteração no repositório."
fi
