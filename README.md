# Bancada de testes para chatbots

Um "teste automatizado para chatbots": um LLM faz o papel de **cliente** (irritado, confuso, objetivo...), conversa com um **bot alvo** e um segundo LLM atua como **juiz**, avaliando a conversa. O dashboard mostra a taxa de resolução, a nota média e as alucinações por cenário.

## Arquitetura

```
React + TS  ──►  API .NET 8  ──►  SQL Server
 (dashboard)      │
                  ├─ ChatRunner : orquestra cliente simulado <-> bot (N turnos)
                  ├─ Judge      : avalia e devolve JSON (resolveu? alucinou? tom? nota 1-5)
                  └─ ILlmClient : abstração do LLM (OpenAiCompatibleClient ou AnthropicClient em produção, FakeLlm nos testes)
```

Tabelas: `Scenarios` (persona + objetivo do cliente) e `Runs` (conversa em JSON + veredito do juiz).

## Como rodar

```bash
cp .env.example .env        # configure um provedor de LLM (Groq, Gemini, Ollama ou Anthropic)
docker compose up --build
# dashboard: http://localhost:5173   API: http://localhost:8080
```

Sem Docker: suba um SQL Server, ajuste `backend/Api/appsettings.json`, rode `dotnet run --project backend/Api` e, em `frontend/`, `npm install && npm run dev`.

Testes: `dotnet test backend/Tests/Tests.csproj`

## Decisões de projeto

- **Provedor de LLM configurável**: o cliente padrão usa o formato `/chat/completions`, aceito por Groq, Gemini, Ollama e outros, então o projeto roda com planos gratuitos. Trocar de provedor é só mudar o `.env`.
- **`ILlmClient`**: isola o provedor e deixa o `ChatRunner` e o `Judge` testáveis sem chamar a API (e sem custo).
- **Ponto de vista de cada lado**: cada LLM vê o que disse como `assistant` e o que o outro disse como `user`, respeitando a regra da API de alternar papéis.
- **Juiz com base de conhecimento**: o juiz recebe os fatos do bot como única fonte de verdade, o que permite detectar alucinação objetivamente.
- **Saída estruturada com validação**: o JSON do juiz é validado (nota de 1 a 5) e há uma nova tentativa se vier inválido.
- **Cenários que testam falhas**: cupom inexistente, troca fora do prazo e pergunta fora do escopo existem para tentar fazer o bot alucinar.

## Validação do juiz (preencher com seus resultados)

Revisei manualmente 5 conversas e comparei com o veredito do juiz:

| Conversa | Minha avaliação | Juiz | Concordou? |
|---|---|---|---|
| | | | |

## Limitações e próximos passos

- O juiz também é um LLM e pode errar; o ideal é calibrá-lo com um conjunto maior de conversas avaliadas por humanos.
- As respostas não são determinísticas: o mesmo cenário pode render notas diferentes (rodar N vezes e tirar a média ajudaria).
- Modelos gratuitos e pequenos erram mais o JSON do juiz e têm limite de requisições por minuto (o cliente espera e tenta de novo em caso de 429).
- Cada rodada gasta ~11 chamadas ao LLM; falta controle de custo e execução em paralelo.
- Falta autenticação, paginação e cenários editáveis pela interface.
