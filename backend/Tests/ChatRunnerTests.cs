using ChatbotEvaluator;

namespace Tests;

public class ChatRunnerTests
{
    [Fact]
    public async Task Runs_the_requested_number_of_turns_alternating_roles()
    {
        var llm = new FakeLlm("mensagem");
        var transcript = await new ChatRunner(llm).RunAsync("persona", "bot", turns: 3);

        Assert.Equal(6, transcript.Count);
        for (var i = 0; i < transcript.Count; i++)
            Assert.Equal(i % 2 == 0 ? "customer" : "bot", transcript[i].Role);
    }

    [Fact]
    public async Task Every_llm_call_starts_with_user_and_alternates_roles()
    {
        var llm = new FakeLlm("mensagem");
        await new ChatRunner(llm).RunAsync("persona", "bot", turns: 3);

        foreach (var (_, messages) in llm.Calls)
        {
            Assert.Equal("user", messages[0].Role);
            Assert.Equal("user", messages[^1].Role);
            for (var i = 1; i < messages.Count; i++)
                Assert.NotEqual(messages[i - 1].Role, messages[i].Role);
        }
    }

    [Fact]
    public async Task Customer_and_bot_use_their_own_system_prompts()
    {
        var llm = new FakeLlm("x");
        await new ChatRunner(llm).RunAsync("PERSONA", "BOT", turns: 1);

        Assert.Equal("PERSONA", llm.Calls[0].System);
        Assert.Equal("BOT", llm.Calls[1].System);
    }
}
