using ChatbotEvaluator;

namespace Tests;

public class TurnTests
{
    [Fact]
    public async Task Customer_turn_on_empty_transcript_starts_with_user()
    {
        var llm = new FakeLlm("oi");
        await new ChatRunner(llm).CustomerTurnAsync("persona", []);

        var messages = llm.Calls[0].Messages;
        Assert.Single(messages);
        Assert.Equal("user", messages[0].Role);
    }

    [Fact]
    public async Task Bot_turn_sees_customer_as_user_and_itself_as_assistant()
    {
        var llm = new FakeLlm("resposta");
        var transcript = new List<ChatMessage> { new("customer", "oi"), new("bot", "olá"), new("customer", "frete?") };
        await new ChatRunner(llm).BotTurnAsync("bot", transcript);

        var roles = llm.Calls[0].Messages.Select(m => m.Role).ToArray();
        Assert.Equal(["user", "assistant", "user"], roles);
    }

    [Fact]
    public async Task Judge_tells_the_model_when_goal_is_missing()
    {
        var llm = new FakeLlm("""{"resolved":true,"hallucinated":false,"tone":"adequado","score":3,"reason":"ok"}""");
        await new Judge(llm).EvaluateAsync("", "base", [new ChatMessage("customer", "oi"), new ChatMessage("bot", "olá")]);

        Assert.Contains("não informado", llm.Calls[0].Messages[0].Content);
    }
}
