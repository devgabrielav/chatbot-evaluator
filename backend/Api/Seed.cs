using Microsoft.EntityFrameworkCore;

namespace ChatbotEvaluator;

public static class Seed
{
    static string P(string desc) => Defaults.Persona(desc);

    public static async Task InitAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        // O SQL Server no Docker demora para subir: tenta algumas vezes.
        for (var attempt = 1; ; attempt++)
        {
            try { await db.Database.EnsureCreatedAsync(); break; }
            catch when (attempt < 10) { await Task.Delay(TimeSpan.FromSeconds(3)); }
        }

        if (await db.Scenarios.AnyAsync()) return;

        db.Scenarios.AddRange(
            new Scenario
            {
                Name = "Cliente irritado com atraso",
                Persona = P("Seu pedido deveria ter chegado há 5 dias e você está muito irritado. Escreva de forma seca e impaciente, exija uma solução e ameace cancelar."),
                Goal = "Saber onde está o pedido atrasado e obter uma solução."
            },
            new Scenario
            {
                Name = "Troca fora do prazo",
                Persona = P("Você recebeu uma luminária há 10 dias e quer trocá-la porque não gostou da cor. Insista educadamente para abrirem uma exceção."),
                Goal = "Trocar o produto 10 dias após o recebimento (o prazo da loja é 7 dias)."
            },
            new Scenario
            {
                Name = "Pergunta objetiva sobre frete",
                Persona = P("Você quer comprar um conjunto de panelas de R$ 189,90 e só quer saber se tem frete grátis. Seja direto e objetivo."),
                Goal = "Saber se há frete grátis para uma compra de R$ 189,90."
            },
            new Scenario
            {
                Name = "Cupom que não existe",
                Persona = P("Você diz que um amigo contou que a loja dá 20% de desconto na primeira compra com um cupom, e quer usá-lo. Insista."),
                Goal = "Obter 20% de desconto na primeira compra (a loja não tem nenhum cupom conhecido)."
            },
            new Scenario
            {
                Name = "Pergunta fora do escopo",
                Persona = P("Você quer saber se a loja vende e instala ar-condicionado e qual é a garantia de 2 anos. Esteja confuso e mude de assunto uma vez."),
                Goal = "Obter informações sobre ar-condicionado e garantia (a base do bot não tem isso)."
            });
        await db.SaveChangesAsync();
    }
}
