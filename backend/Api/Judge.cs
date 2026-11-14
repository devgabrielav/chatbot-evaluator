using System.Text.Json;

namespace ChatbotEvaluator;

// LLM-as-judge: avalia a conversa e devolve um JSON estruturado.
public class Judge(ILlmClient llm)
{
    const string System = """
        Você avalia conversas entre um cliente e um chatbot de atendimento (reais, simuladas ou digitadas).
        Você recebe o objetivo do cliente, a base de conhecimento do bot (a ÚNICA fonte de verdade) e a conversa.
        Critérios:
        - resolved: true se o bot tratou o pedido corretamente segundo as regras (atendeu, negou com educação ou encaminhou ao humano quando devia).
        - hallucinated: true se o bot afirmou algo que não está na base de conhecimento ou que a contradiz.
        - tone: "adequado", "frio", "excessivo" ou "rude".
        - score: inteiro de 1 a 5 para a qualidade geral.
        - reason: no máximo 2 frases explicando a nota.
        Responda SOMENTE com um objeto JSON, sem markdown:
        {"resolved":true,"hallucinated":false,"tone":"adequado","score":4,"reason":"..."}
        """;

    static readonly JsonSerializerOptions Opts = new() { PropertyNameCaseInsensitive = true };

    public async Task<Evaluation> EvaluateAsync(string goal, string knowledge, IEnumerable<ChatMessage> transcript,
        CancellationToken ct = default)
    {
        var convo = string.Join("\n", transcript.Select(m => $"{(m.Role == "customer" ? "Cliente" : "Bot")}: {m.Content}"));
        var objective = string.IsNullOrWhiteSpace(goal) ? "(não informado; deduza pela conversa)" : goal;
        var prompt = $"Objetivo do cliente: {objective}\n\nBase de conhecimento do bot:\n{knowledge}\n\nConversa:\n{convo}";

        // Uma nova tentativa caso o modelo devolva um JSON inválido.
        for (var attempt = 0; attempt < 2; attempt++)
        {
            var raw = await llm.CompleteAsync(System, [new LlmMessage("user", prompt)], ct);
            if (TryParse(raw, out var evaluation)) return evaluation;
        }
        throw new InvalidOperationException("O juiz não devolveu um JSON válido.");
    }

    public static bool TryParse(string raw, out Evaluation evaluation)
    {
        evaluation = default!;
        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start < 0 || end < start) return false;
        try
        {
            var e = JsonSerializer.Deserialize<Evaluation>(raw[start..(end + 1)], Opts);
            if (e is null || e.Score is < 1 or > 5) return false;
            evaluation = e;
            return true;
        }
        catch (JsonException) { return false; }
    }
}
