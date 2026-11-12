export function BotPanel({ value, onChange, onReset }: { value: string; onChange: (v: string) => void; onReset: () => void }) {
  return (
    <details className="botpanel">
      <summary>Base de conhecimento do bot (editável)</summary>
      <p className="hint">
        É o que o bot sabe e também a fonte da verdade do juiz. Mude uma regra (ex.: o prazo de troca) e rode de novo
        para ver como o bot e a avaliação reagem.
      </p>
      <textarea rows={9} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Base de conhecimento do bot" />
      <button className="ghost" onClick={onReset}>Restaurar padrão</button>
    </details>
  );
}
