interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  // current 는 0-based 인덱스다. 사람에게는 "8문제 중 3번째"로 보여야 하므로
  // 표시와 진행률 모두 1-based 로 환산한다. 이전에는 마지막 문제에서
  // 진행바가 83% 에 멈춘 채 결과 화면으로 넘어갔다.
  const position = Math.min(current + 1, total);
  const percent = total > 0 ? (position / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{position} / {total}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
