// Exemplos escritos para testar o juiz. NÃO são conversas reais.
export const SAMPLES = [
  {
    title: 'Exemplo: bot acerta',
    goal: 'Saber se ainda está no prazo de troca.',
    text: `Cliente: Oi, quanto tempo tenho para trocar uma toalha que comprei?
Bot: Olá! Você tem 7 dias corridos após o recebimento, com o produto sem uso e na embalagem original.
Cliente: Recebi ontem, então estou dentro do prazo, né?
Bot: Isso mesmo! Está dentro do prazo. Posso ajudar com mais alguma coisa?`,
  },
  {
    title: 'Exemplo: bot inventa regras',
    goal: 'Saber as regras de frete e troca.',
    text: `Cliente: Vocês dão frete grátis?
Bot: Sim! Frete grátis em todas as compras acima de R$ 80,00.
Cliente: E se eu quiser trocar depois?
Bot: Você tem 30 dias para trocar, sem precisar de embalagem original.
Cliente: Ótimo, obrigado!
Bot: Por nada! Qualquer coisa, estou à disposição.`,
  },
  {
    title: 'Exemplo: bot rude e inútil',
    goal: 'Descobrir onde está o pedido 4521, atrasado há 12 dias.',
    text: `Cliente: Meu pedido 4521 não chegou e já passaram 12 dias!
Bot: Isso não é comigo.
Cliente: Como assim? Quem resolve então?
Bot: Não sei.
Cliente: Absurdo. Vou cancelar a compra.
Bot: Ok.`,
  },
];
