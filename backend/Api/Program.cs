using System.Text.Json;
using ChatbotEvaluator;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDb>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
// LLM_PROVIDER=anthropic usa a API da Anthropic; qualquer outro valor (padrão) usa o formato OpenAI,
// compatível com Groq, Gemini, Ollama e outros provedores gratuitos.
if (builder.Configuration["LLM_PROVIDER"] == "anthropic")
    builder.Services.AddHttpClient<ILlmClient, AnthropicClient>(c => c.Timeout = TimeSpan.FromSeconds(90));
else
    builder.Services.AddHttpClient<ILlmClient, OpenAiCompatibleClient>(c => c.Timeout = TimeSpan.FromSeconds(120));
builder.Services.AddScoped<ChatRunner>();
builder.Services.AddScoped<Judge>();

var app = builder.Build();
await Seed.InitAsync(app.Services);

// Limites simples para proteger custo e banco: até 40 mensagens de 4000 caracteres.
static bool Valid(List<ChatMessage>? t) =>
    t is { Count: <= 40 } && t.All(m => m.Role is "customer" or "bot" && m.Content is { Length: > 0 and <= 4000 });

static string Trunc(string? s, int max)
{
    s = (s ?? "").Trim();
    return s.Length > max ? s[..max] : s;
}

app.MapGet("/health", () => Results.Ok());
app.MapGet("/api/bot-prompt", () => new { prompt = Defaults.BotPrompt });

// ---- Cenários ----
app.MapGet("/api/scenarios", async (AppDb db) => await db.Scenarios.OrderBy(s => s.Id).ToListAsync());

app.MapPost("/api/scenarios", async (NewScenario n, AppDb db) =>
{
    if (string.IsNullOrWhiteSpace(n.Name) || string.IsNullOrWhiteSpace(n.Description) || string.IsNullOrWhiteSpace(n.Goal))
        return Results.BadRequest("Preencha nome, descrição do cliente e objetivo.");
    var s = new Scenario { Name = Trunc(n.Name, 120), Persona = Defaults.Persona(Trunc(n.Description, 800)), Goal = Trunc(n.Goal, 400) };
    db.Scenarios.Add(s);
    await db.SaveChangesAsync();
    return Results.Ok(s);
});

app.MapDelete("/api/scenarios/{id:int}", async (int id, AppDb db) =>
    await db.Scenarios.Where(s => s.Id == id).ExecuteDeleteAsync() > 0 ? Results.NoContent() : Results.NotFound());

// ---- Turnos de conversa (o front controla o ritmo e mostra cada mensagem ao vivo) ----
app.MapPost("/api/chat/customer-turn", async (CustomerTurnRequest r, ChatRunner runner, CancellationToken ct) =>
{
    if (!Valid(r.Transcript)) return Results.BadRequest("Conversa inválida ou grande demais.");
    return Results.Ok(new { content = await runner.CustomerTurnAsync(r.Persona, r.Transcript, ct) });
});

app.MapPost("/api/chat/bot-turn", async (BotTurnRequest r, ChatRunner runner, CancellationToken ct) =>
{
    if (!Valid(r.Transcript) || r.Transcript.Count == 0 || r.Transcript[^1].Role != "customer")
        return Results.BadRequest("A conversa deve terminar com uma mensagem do cliente.");
    return Results.Ok(new { content = await runner.BotTurnAsync(r.BotPrompt, r.Transcript, ct) });
});

// ---- Avaliação (serve para conversas simuladas, ao vivo e importadas) ----
app.MapPost("/api/evaluate", async (EvaluateRequest r, AppDb db, Judge judge, CancellationToken ct) =>
{
    if (!Valid(r.Transcript) || r.Transcript.Count < 2)
        return Results.BadRequest("Envie uma conversa com pelo menos 2 mensagens.");

    var ev = await judge.EvaluateAsync(r.Goal ?? "", r.BotPrompt, r.Transcript, ct);
    var run = new Run
    {
        ScenarioId = r.ScenarioId,
        Title = Trunc(r.Title, 120),
        Source = r.Source is "simulado" or "manual" or "importado" ? r.Source : "manual",
        Goal = Trunc(r.Goal, 400),
        BotPrompt = Trunc(r.BotPrompt, 4000),
        TranscriptJson = JsonSerializer.Serialize(r.Transcript),
        Resolved = ev.Resolved,
        Hallucinated = ev.Hallucinated,
        Tone = ev.Tone,
        Score = ev.Score,
        Reason = ev.Reason
    };
    db.Runs.Add(run);
    await db.SaveChangesAsync(ct);
    return Results.Ok(Mapper.ToDto(run, r.Transcript));
});

app.MapGet("/api/runs", async (AppDb db) =>
{
    var runs = await db.Runs.OrderByDescending(r => r.Id).Take(100).ToListAsync();
    return runs.Select(r => Mapper.ToDto(r, JsonSerializer.Deserialize<List<ChatMessage>>(r.TranscriptJson) ?? []));
});

app.Run();
