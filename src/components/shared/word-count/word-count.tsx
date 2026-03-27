interface WordCountProps {
  value: number;
}

export function WordCount({ value }: WordCountProps) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-app-text-secondary">
      {value} {value === 1 ? "word" : "words"}
    </span>
  );
}
