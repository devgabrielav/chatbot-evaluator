# 🤖 Chatbot Evaluator

This project is a lightweight evaluation workspace for testing chatbot behavior in realistic customer-service scenarios.

The app simulates a customer and a bot conversation, then uses a second LLM as a judge to score the interaction. It helps teams review whether the bot solved the user request, stayed within the allowed knowledge, avoided hallucinations, and maintained a good tone.

## 🎯 What the app does

- Simulate customer conversations with different personas and goals
- Run live customer/bot turns and inspect the interaction step by step
- Evaluate a conversation against the bot's knowledge base
- Import transcripts and score them automatically
- Review results by scenario, source, and verdict
- Compare how prompt changes affect chatbot outcomes

## 🧩 Core workflow

1. A scenario defines the customer profile and objective.
2. A simulated customer speaks to the bot.
3. The bot replies using its configured prompt and knowledge.
4. A judge evaluates the final transcript.
5. Results are stored and displayed in the dashboard.

This is useful for testing prompt regressions, validating response quality, and checking whether the bot drifts away from the expected rules.

## 🛠️ Technologies

### Backend
- .NET 8
- ASP.NET Core
- Entity Framework Core
- SQL Server
- LLM abstraction layer for OpenAI-compatible providers and Anthropic

### Frontend
- React
- TypeScript
- Vite
- CSS

### AI and evaluation layer
- OpenAI-compatible API support (Groq, Gemini, Ollama, and similar providers)
- Anthropic API option
- Structured evaluation JSON with validation and retry logic

### Testing
- xUnit
- Fake LLM client for deterministic tests

## 🚀 Run locally

### Option 1: Docker

```bash
docker compose up --build
```

Then open:
- Frontend: http://localhost:5173
- API: http://localhost:8080

### Option 2: Manual setup

1. Start a SQL Server instance.
2. Update the connection string in `backend/Api/appsettings.json`.
3. Configure your LLM provider credentials in the environment.
4. Run the API:

```bash
dotnet run --project backend/Api
```

5. Install frontend dependencies and start the app:

```bash
cd frontend
npm install
npm run dev
```

### Tests

```bash
dotnet test backend/Tests/Tests.csproj
```

## 🧠 Project structure

```text
backend/
  Api/
  Tests/
frontend/
  src/
  package.json
docker-compose.yml
README.md
```

## 📌 Highlights

- Configurable LLM provider through environment variables
- Stateless chat API for turn-by-turn interactions
- Scenario-based evaluation for customer support use cases
- Result history and verdict summaries
- Built for regression testing of prompts and bot behavior

## ⚠️ Important notes

- The judge is an LLM, so it can still make mistakes and should be calibrated with human-reviewed examples.
- Scores may vary between runs because responses are not fully deterministic.
- LLM usage can add cost and rate-limit constraints depending on the provider.

---

This app is designed to make chatbot quality checks more transparent, repeatable, and easier to compare across prompt changes.
