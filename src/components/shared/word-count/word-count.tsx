interface WordCountProps {
  value: number;
}

export function WordCount({ value }: WordCountProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-app-panel-strong px-3 py-2 text-[0.82rem] font-bold tracking-[0.02em] text-app-text-secondary">
      {value} {value === 1 ? "word" : "words"}
    </span>
  );
}
