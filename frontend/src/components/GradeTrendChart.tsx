export function GradeTrendChart({ points }: { points: { date: string; score: number }[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-gray-500">No grades yet.</p>;
  }
  const max = Math.max(...points.map((p) => p.score), 100);
  return (
    <div className="flex h-24 items-end gap-1.5">
      {points.map((p, i) => (
        <div
          key={i}
          title={`${p.score} pts`}
          className="flex-1 rounded-t bg-blue-600"
          style={{ height: `${Math.max(4, (p.score / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
