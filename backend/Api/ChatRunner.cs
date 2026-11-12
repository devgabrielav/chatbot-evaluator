namespace ChatbotEvaluator;

// Gera as falas do cliente simulado e do bot. Os endpoints de turno usam estes métodos
// individualmente (o front controla o ritmo); RunAsync roda a conversa inteira de uma vez.
public class ChatRunner(ILlmClient llm)
{
    const string StartPrompt = "Inicie a conversa com a sua primeira mensagem.";

    public Task<string> CustomerTurnAsync(string persona, IEnumerable<ChatMessage> transcript, CancellationToken ct = default) =>
        llm.CompleteAsync(persona, ToView(transcript, "customer", StartPrompt), ct);

    public Task<string> BotTurnAsync(string botPrompt, IEnumerable<ChatMessage> transcript, CancellationToken ct = default) =>
        llm.CompleteAsync(botPrompt, ToView(transcript, "bot"), ct);

    public async Task<List<ChatMessage>> RunAsync(string persona, string botPrompt, int turns, CancellationToken ct = default)
    {
        var transcript = new List<ChatMessage>();
        for (var i = 0; i < turns; i++)
        {
            transcript.Add(new("customer", await CustomerTurnAsync(persona, transcript, ct)));
            transcript.Add(new("bot", await BotTurnAsync(botPrompt, transcript, ct)));
        }
        return transcript;
    }

    // Cada lado vê a conversa do próprio ponto de vista: o que ele disse é "assistant",
    // o que o outro disse é "user". A API exige que a lista comece com "user".
    static List<LlmMessage> ToView(IEnumerable<ChatMessage> transcript, string self, string? firstUser = null)
    {
        var view = transcript
            .Select(m => new LlmMessage(m.Role == self ? "assistant" : "user", m.Content))
            .ToList();
        if (firstUser is not null) view.Insert(0, new("user", firstUser));
        return view;
    }
}
