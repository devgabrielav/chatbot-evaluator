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

app.MapGet("/health", () => Results.Ok());

app.MapGet("/api/scenarios", async (AppDb db) => await db.Scenarios.OrderBy(s => s.Id).ToListAsync());

app.MapPost("/api/scenarios/{id:int}/run", async (int id, AppDb db, ChatRunner runner, Judge judge, CancellationToken ct) =>
{
    var scenario = await db.Scenarios.FindAsync(new object[] { id }, ct);
    if (scenario is null) return Results.NotFound();

    var transcript = await runner.RunAsync(scenario.Persona, Defaults.BotPrompt, Defaults.Turns, ct);
    var ev = await judge.EvaluateAsync(scenario.Goal, Defaults.BotPrompt, transcript, ct);

    var run = new Run
    {
        ScenarioId = scenario.Id,
        TranscriptJson = JsonSerializer.Serialize(transcript),
        Resolved = ev.Resolved,
        Hallucinated = ev.Hallucinated,
        Tone = ev.Tone,
        Score = ev.Score,
        Reason = ev.Reason
    };
    db.Runs.Add(run);
    await db.SaveChangesAsync(ct);
    return Results.Ok(Mapper.ToDto(run, scenario.Name, transcript));
});

app.MapGet("/api/runs", async (AppDb db) =>
{
    var runs = await db.Runs.Include(r => r.Scenario).OrderByDescending(r => r.Id).Take(50).ToListAsync();
    return runs.Select(r => Mapper.ToDto(r, r.Scenario!.Name,
        JsonSerializer.Deserialize<List<ChatMessage>>(r.TranscriptJson) ?? []));
});

app.MapGet("/api/stats", async (AppDb db) =>
{
    var runs = await db.Runs.Select(r => new { r.ScenarioId, r.Resolved, r.Hallucinated, r.Score }).ToListAsync();
    var scenarios = await db.Scenarios.OrderBy(s => s.Id).ToListAsync();
    return scenarios.Select(s =>
    {
        var rs = runs.Where(r => r.ScenarioId == s.Id).ToList();
        return new StatDto(s.Id, s.Name, rs.Count,
            rs.Count == 0 ? 0 : rs.Average(r => r.Resolved ? 1.0 : 0.0),
            rs.Count == 0 ? 0 : rs.Average(r => r.Score),
            rs.Count(r => r.Hallucinated));
    });
});

app.Run();
