interface FuriganaTextProps {
  japanese: string;
  reading: string;
  show: boolean;
  className?: string;
}

export function FuriganaText({ japanese, reading, show, className }: FuriganaTextProps) {
  if (!show || japanese === reading) {
    return <span className={className}>{japanese}</span>;
  }

  return (
    <ruby className={className}>
      {japanese}
      <rt className="text-[0.5em] font-normal tracking-wide">{reading}</rt>
    </ruby>
  );
}
