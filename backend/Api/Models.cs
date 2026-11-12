namespace ChatbotEvaluator;

// Mensagem no formato da API do LLM (role: "user" | "assistant")
public record LlmMessage(string Role, string Content);

// Mensagem da conversa (role: "customer" | "bot")
public record ChatMessage(string Role, string Content);

public record Evaluation(bool Resolved, bool Hallucinated, string Tone, int Score, string Reason);

public class Scenario
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Persona { get; set; } = "";
    public string Goal { get; set; } = "";
}

// Uma conversa avaliada. Source: "simulado" | "manual" (chat ao vivo) | "importado".
public class Run
{
    public int Id { get; set; }
    public int? ScenarioId { get; set; }
    public string Title { get; set; } = "";
    public string Source { get; set; } = "simulado";
    public string Goal { get; set; } = "";
    public string BotPrompt { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string TranscriptJson { get; set; } = "[]";
    public bool Resolved { get; set; }
    public bool Hallucinated { get; set; }
    public string Tone { get; set; } = "";
    public int Score { get; set; }
    public string Reason { get; set; } = "";
}

public record RunDto(int Id, int? ScenarioId, string Title, string Source, string Goal, string BotPrompt,
    DateTime CreatedAt, bool Resolved, bool Hallucinated, string Tone, int Score, string Reason,
    List<ChatMessage> Transcript);

public record CustomerTurnRequest(string Persona, List<ChatMessage> Transcript);
public record BotTurnRequest(string BotPrompt, List<ChatMessage> Transcript);
public record EvaluateRequest(int? ScenarioId, string Title, string Source, string Goal, string BotPrompt,
    List<ChatMessage> Transcript);
public record NewScenario(string Name, string Description, string Goal);

public static class Mapper
{
    public static RunDto ToDto(Run r, List<ChatMessage> transcript) =>
        new(r.Id, r.ScenarioId, r.Title, r.Source, r.Goal, r.BotPrompt, r.CreatedAt, r.Resolved,
            r.Hallucinated, r.Tone, r.Score, r.Reason, transcript);
}
