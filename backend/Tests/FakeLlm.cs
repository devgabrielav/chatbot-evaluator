using ChatbotEvaluator;

namespace Tests;

public class FakeLlm(params string[] replies) : ILlmClient
{
    public List<(string System, List<LlmMessage> Messages)> Calls { get; } = new();
    int _i;

    public Task<string> CompleteAsync(string system, IReadOnlyList<LlmMessage> messages, CancellationToken ct = default)
    {
        Calls.Add((system, messages.ToList()));
        return Task.FromResult(replies[Math.Min(_i++, replies.Length - 1)]);
    }
}
