namespace ChatbotEvaluator;

// Orquestra a conversa: o LLM "cliente" e o bot alvo se alternam por N turnos.
public class ChatRunner(ILlmClient llm)
{
    const string StartPrompt = "Inicie a conversa com a sua primeira mensagem.";

    public async Task<List<ChatMessage>> RunAsync(string persona, string botPrompt, int turns, CancellationToken ct = default)
    {
        var transcript = new List<ChatMessage>();
        for (var i = 0; i < turns; i++)
        {
            var customer = await llm.CompleteAsync(persona, ToView(transcript, "customer", StartPrompt), ct);
            transcript.Add(new("customer", customer));

            var bot = await llm.CompleteAsync(botPrompt, ToView(transcript, "bot"), ct);
            transcript.Add(new("bot", bot));
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
