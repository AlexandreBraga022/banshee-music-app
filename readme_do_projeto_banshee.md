# ⚡ Banshee - Music Intelligence

O **Banshee** é um aplicativo focado em inteligência musical. Ele permite que os usuários descubram informações detalhadas sobre seus artistas favoritos, incluindo biografias, métricas de popularidade, artistas similares e músicas em alta. 

O projeto é dividido em duas partes principais:
1. **Frontend (Mobile):** Construído com React Native e Expo.
2. **Backend (API):** Construído com Python e FastAPI, integrado à inteligência artificial do Google Gemini.

---

## 🧠 Como o código funciona

A arquitetura do projeto opera de forma cliente-servidor:

* **O Aplicativo (Frontend):** 
  O código em `App.js` renderiza a interface do usuário nativa para Android e iOS. Ao digitar o nome de um artista e clicar em "Pesquisar", o aplicativo coleta essa informação e faz uma requisição HTTP (via `fetch`) para o servidor local. A comunicação em rede é gerenciada dinamicamente, permitindo que o aplicativo descubra o IP da máquina de desenvolvimento utilizando a biblioteca `expo-constants`.

* **O Servidor (Backend):** 
  O arquivo `banshee_backend.py` roda uma API construída com FastAPI. Ao receber o nome do artista, o servidor valida a requisição, carrega a chave da API do arquivo `.env` e aciona o modelo `gemini-3.8-flash`. Um *System Prompt* rigoroso garante que a IA devolva dados reais e estruturados exclusivamente em formato JSON. O servidor recebe essa resposta, faz a limpeza necessária e a devolve para o celular, que renderiza os painéis (cards) dinamicamente na tela.

---

## 🚀 Como executar o projeto

Para rodar a aplicação completa na sua máquina e testar no celular, você precisará de **dois terminais** abertos simultaneamente no seu editor de código (como o VS Code).

### Passo 1: Iniciar o Servidor Backend (Python)

Este terminal será responsável por rodar a API e se comunicar com o Google Gemini.

1. Abra um terminal e navegue até a pasta raiz do backend:
   ```bash
   cd banshee-app
   ```
2. Certifique-se de ter o arquivo `.env` criado nesta pasta com a sua chave da API:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```
3. Inicie o servidor liberando o acesso para a sua rede local (`0.0.0.0`):
   ```bash
   python -m uvicorn banshee_backend:app --host 0.0.0.0 --port 8000 --reload
   ```
4. Aguarde a mensagem `Uvicorn running on http://0.0.0.0:8000` aparecer. **Deixe este terminal rodando.**

### Passo 2: Iniciar o Aplicativo Frontend (Expo)

Abra um **novo terminal** (sem fechar o anterior) para rodar a interface do usuário.

1. Navegue até a pasta do aplicativo mobile:
   ```bash
   cd banshee-mobile
   ```
2. Inicie o servidor do Expo (a flag `-c` limpa o cache para garantir que as configurações de rede mais recentes sejam lidas):
   ```bash
   npx expo start -c
   ```
3. Um QR Code gigante aparecerá na tela do terminal.

### Passo 3: Testar no Celular Físico

1. Certifique-se de que o seu celular e o seu computador estão conectados na **mesma rede Wi-Fi**.
2. Instale e abra o aplicativo **Expo Go** no seu celular (disponível na Play Store e App Store).
3. No Expo Go, escaneie o QR Code que apareceu no terminal.
4. O aplicativo será carregado na tela do celular e estará pronto para se comunicar com o servidor Python.

> **Dica de Troubleshooting de Rede:** Se o aplicativo carregar no celular, mas a pesquisa não retornar resultados (erro de conexão), o Firewall do Windows pode estar bloqueando a porta 8000. Para resolver, vá nas configurações de rede do Windows e mude o perfil da sua rede Wi-Fi de "Pública" para "Privada".