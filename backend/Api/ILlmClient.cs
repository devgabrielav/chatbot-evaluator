namespace ChatbotEvaluator;

public interface ILlmClient
{
    Task<string> CompleteAsync(string system, IReadOnlyList<LlmMessage> messages, CancellationToken ct = default);
}
