using ChatbotEvaluator;

namespace Tests;

public class JudgeTests
{
    const string Valid = """{"resolved":true,"hallucinated":false,"tone":"adequado","score":4,"reason":"ok"}""";

    [Fact]
    public void Parses_plain_json()
    {
        Assert.True(Judge.TryParse(Valid, out var e));
        Assert.True(e.Resolved);
        Assert.Equal(4, e.Score);
    }

    [Fact]
    public void Parses_json_wrapped_in_markdown_fence()
    {
        Assert.True(Judge.TryParse($"```json\n{Valid}\n```", out var e));
        Assert.Equal("adequado", e.Tone);
    }

    [Theory]
    [InlineData("não sei avaliar")]
    [InlineData("{ quebrado")]
    [InlineData("""{"resolved":true,"hallucinated":false,"tone":"x","score":9,"reason":"fora da escala"}""")]
    public void Rejects_invalid_output(string raw) => Assert.False(Judge.TryParse(raw, out _));

    [Fact]
    public async Task Retries_once_when_first_answer_is_invalid()
    {
        var llm = new FakeLlm("desculpe, não consegui", Valid);
        var ev = await new Judge(llm).EvaluateAsync("objetivo", "base", [new ChatMessage("customer", "oi")]);

        Assert.Equal(2, llm.Calls.Count);
        Assert.Equal(4, ev.Score);
    }

    [Fact]
    public async Task Throws_after_two_invalid_answers()
    {
        var llm = new FakeLlm("lixo");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new Judge(llm).EvaluateAsync("objetivo", "base", [new ChatMessage("customer", "oi")]));
    }
}
