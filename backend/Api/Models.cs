namespace ChatbotEvaluator;

// Mensagem no formato da API do LLM (role: "user" | "assistant")
public record LlmMessage(string Role, string Content);

// Mensagem da conversa simulada (role: "customer" | "bot")
public record ChatMessage(string Role, string Content);

public record Evaluation(bool Resolved, bool Hallucinated, string Tone, int Score, string Reason);

public class Scenario
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Persona { get; set; } = "";
    public string Goal { get; set; } = "";
}

public class Run
{
    public int Id { get; set; }
    public int ScenarioId { get; set; }
    public Scenario? Scenario { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string TranscriptJson { get; set; } = "[]";
    public bool Resolved { get; set; }
    public bool Hallucinated { get; set; }
    public string Tone { get; set; } = "";
    public int Score { get; set; }
    public string Reason { get; set; } = "";
}

public record RunDto(int Id, int ScenarioId, string ScenarioName, DateTime CreatedAt, bool Resolved,
    bool Hallucinated, string Tone, int Score, string Reason, List<ChatMessage> Transcript);

public record StatDto(int ScenarioId, string ScenarioName, int Runs, double ResolvedRate,
    double AvgScore, int Hallucinations);

public static class Mapper
{
    public static RunDto ToDto(Run r, string scenarioName, List<ChatMessage> transcript) =>
        new(r.Id, r.ScenarioId, scenarioName, r.CreatedAt, r.Resolved, r.Hallucinated,
            r.Tone, r.Score, r.Reason, transcript);
}
