using System.Net.Http.Json;
using System.Text.Json;

namespace ChatbotEvaluator;

public class AnthropicClient(HttpClient http, IConfiguration config) : ILlmClient
{
    public async Task<string> CompleteAsync(string system, IReadOnlyList<LlmMessage> messages, CancellationToken ct = default)
    {
        var apiKey = config["ANTHROPIC_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("ANTHROPIC_API_KEY não configurada.");

        var body = new
        {
            model = string.IsNullOrWhiteSpace(config["LLM_MODEL"]) ? "claude-sonnet-5-5" : config["LLM_MODEL"],
            max_tokens = 600,
            system,
            messages = messages.Select(m => new { role = m.Role, content = m.Content })
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.Add("x-api-key", apiKey);
        req.Headers.Add("anthropic-version", "2023-06-01");

        using var res = await http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
        return string.Concat(doc.RootElement.GetProperty("content").EnumerateArray()
            .Where(b => b.GetProperty("type").GetString() == "text")
            .Select(b => b.GetProperty("text").GetString()));
    }
}
