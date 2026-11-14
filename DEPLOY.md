# Deploy gratuito (um único container, sem servidor de banco)

A aplicação agora é **um container só**: a API .NET serve o front React e guarda os dados em um arquivo **SQLite**. Não existe mais SQL Server para contratar.

## Antes de publicar

1. Tenha uma chave de LLM gratuita (Groq ou Gemini). O Ollama só funciona na sua máquina.
2. **Defina um `ACCESS_CODE`.** Sem ele, qualquer pessoa com o link gasta a cota da sua chave. Compartilhe o código só com quem for avaliar.
3. Suba o projeto para um repositório no GitHub (o `.env` fica de fora, já está no `.gitignore`).

## Opção 1: Render (Web Service, plano gratuito)

1. Em render.com, **New → Web Service** e conecte o repositório.
2. Em *Runtime*, escolha **Docker** (ele usa o `Dockerfile` da raiz) e, em *Instance Type*, o plano **Free**.
3. Em *Environment*, adicione: `LLM_PROVIDER=openai`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` e `ACCESS_CODE` (valores do `.env.example`).
4. Faça o deploy e abra a URL gerada.

Atenção:
- No plano gratuito o serviço "dorme" sem uso, e o primeiro acesso depois disso pode levar cerca de 1 minuto. **Abra o site antes da entrevista.**
- O disco é temporário: o histórico some quando o serviço reinicia ou é publicado de novo. Os cenários padrão são recriados sozinhos.

## Opção 2: Hugging Face Spaces (Docker)

1. Em huggingface.co/new-space, escolha **SDK: Docker** e hardware gratuito (CPU basic).
2. Adicione no topo do `README.md` do Space:
   ```
   ---
   title: Bancada de testes para chatbots
   sdk: docker
   app_port: 8080
   ---
   ```
3. Em *Settings → Variables and secrets*, cadastre `LLM_API_KEY` e `ACCESS_CODE` como **secrets**, e `LLM_BASE_URL`, `LLM_MODEL` e `LLM_PROVIDER` como variáveis.
4. Envie os arquivos do projeto para o repositório do Space (git push).

As condições dos planos gratuitos mudam com o tempo, então confirme limites e requisitos no site de cada plataforma.

## Plano B (o mais seguro para a entrevista)

Rode localmente com `docker compose up --build` e compartilhe a tela. Assim não depende de internet, de "cold start" nem de limite de plataforma. Deixe o deploy como link extra no README.
