using System.Net.Http.Json;
using System.Text.Json;

namespace ChatbotEvaluator;

// Funciona com qualquer provedor que siga o formato /chat/completions da OpenAI:
// Groq, Google Gemini, Ollama (local), OpenRouter etc. Muda só a configuração.
public class OpenAiCompatibleClient(HttpClient http, IConfiguration config) : ILlmClient
{
    static string Or(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value;

    public async Task<string> CompleteAsync(string system, IReadOnlyList<LlmMessage> messages, CancellationToken ct = default)
    {
        var baseUrl = Or(config["LLM_BASE_URL"], "https://api.groq.com/openai/v1").TrimEnd('/');
        var model = Or(config["LLM_MODEL"], "llama-3.3-70b-versatile");
        var apiKey = config["LLM_API_KEY"];

        var chat = new List<object> { new { role = "system", content = system } };
        chat.AddRange(messages.Select(m => new { role = m.Role, content = m.Content }));
        var body = new { model, messages = chat, max_tokens = 1000, temperature = 0.7 };

        for (var attempt = 1; ; attempt++)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions")
            {
                Content = JsonContent.Create(body)
            };
            if (!string.IsNullOrWhiteSpace(apiKey)) req.Headers.Add("Authorization", $"Bearer {apiKey}");

            using var res = await http.SendAsync(req, ct);

            // Planos gratuitos têm limite por minuto: espera e tenta de novo.
            if ((int)res.StatusCode == 429 && attempt < 5)
            {
                await Task.Delay(res.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(5 * attempt), ct);
                continue;
            }

            res.EnsureSuccessStatusCode();
            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        }
    }
}
