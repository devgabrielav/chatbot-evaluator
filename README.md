# 🤖 Chatbot Evaluator

A lightweight evaluation workspace for chatbot behavior. The app simulates a customer conversation, lets a target bot respond, and then uses a second LLM as a judge to assess the interaction. It also supports live chat and imported transcripts, making it useful for prompt regression testing and quality review.

## 🎯 Project goal

This project helps evaluate whether a chatbot follows its expected rules, answers consistently, and avoids hallucinations or policy-breaking behavior. Instead of relying only on manual testing, it creates repeatable scenarios where a simulated user and the bot interact under controlled conditions, and a judge rates the outcome.

## ✨ What the app can do

- **Scenario simulation:** run a customer-bot conversation step by step and review the result at the end
- **Live chat:** talk directly with the bot and ask for an evaluation
- **Transcript import:** analyze pasted conversations or JSON data against the bot knowledge base
- **Editable knowledge base:** adjust a rule and re-run the scenario to test regressions
- **Results dashboard:** review summaries, scenario-level scores, and historical runs

## 🧠 How it works

The app creates a conversation between a simulated customer and the target bot. A second model acts as the judge and evaluates whether the bot followed the expected rules, answered correctly, and stayed grounded in the provided knowledge.

The flow is intentionally simple:

1. A scenario defines the context and expected facts
2. A simulated customer asks questions or triggers edge cases
3. The bot responds in the conversation
4. The judge reviews the transcript and returns a structured assessment
5. The results can be inspected in the UI or compared across runs

## 🏗️ Architecture

```text
Browser (React + TypeScript)
      │
      ▼
  API (.NET 8)
      ├─ ChatRunner: orchestrates customer and bot turns
      ├─ Judge: evaluates responses and returns structured scoring
      ├─ ILlmClient: abstracts provider-specific LLM integrations
      ├─ SQLite: stores scenarios and evaluation runs
      └─ Static frontend serving for local or simple deployments
```

## 🧩 Tech stack

### Backend

- .NET 8
- ASP.NET Core Minimal API
- C#
- SQLite
- EF Core
- LLM integrations via OpenAI-compatible APIs, Anthropic, and other compatible providers

### Frontend

- React
- TypeScript
- Vite
- CSS

### Core project modules

- `backend/Api/ChatRunner.cs` — conversation orchestration
- `backend/Api/Judge.cs` — automated evaluation logic
- `backend/Api/ILlmClient.cs` — abstraction for LLM providers
- `backend/Api/OpenAiCompatibleClient.cs` — generic OpenAI-style provider client
- `backend/Api/AnthropicClient.cs` — Anthropic client
- `frontend/src` — app interface and interaction flow

## 🚀 Run locally

### Option 1: Docker

1. Create the environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in the required LLM values such as provider, API key, base URL, and model.
3. Start the app:

   ```bash
   docker compose up --build
   ```

4. Open the app at:

   ```text
   http://localhost:8080
   ```

### Option 2: Local development

1. Start the API:

   ```bash
   dotnet run --project backend/Api
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Run the frontend:

   ```bash
   npm run dev
   ```

4. Open the app at:

   ```text
   http://localhost:5173
   ```

### Tests

```bash
dotnet test backend/Tests/Tests.csproj
```

## 🔒 Notes

- The project keeps a local SQLite database by default, which makes it easy to run without a separate database service.
- The app can use different LLM providers through environment-based configuration.
- The judge is designed to assess responses against a source of truth, which helps detect unsupported or invented answers.
- The app includes optional access protection for public deployments.

## 📌 Summary

This project is a practical evaluation sandbox for chatbot quality: it helps test conversations, compare expected behavior against reality, and quickly spot regressions in prompt-based systems.
