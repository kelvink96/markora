import { StatusBadge } from "../status-badge";

interface WordCountProps {
  value: number;
}

export function WordCount({ value }: WordCountProps) {
  return (
    <StatusBadge tone="success">
      {value} {value === 1 ? "word" : "words"}
    </StatusBadge>
  );
}
