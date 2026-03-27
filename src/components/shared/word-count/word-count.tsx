import "./word-count.css";

interface WordCountProps {
  value: number;
}

export function WordCount({ value }: WordCountProps) {
  return <span className="word-count">{value} {value === 1 ? "word" : "words"}</span>;
}
