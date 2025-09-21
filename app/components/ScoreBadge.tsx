
type ScoreBadgeProps = {
  score: number;
};

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let containerClass = "";
  let textClass = "";
  let label = "";

  if (score > 70) {
    containerClass = "bg-badge-green";
    textClass = "text-green-600";
    label = "Strong";
  } else if (score > 49) {
    containerClass = "bg-badge-yellow";
    textClass = "text-yellow-600";
    label = "Good Start";
  } else {
    containerClass = "bg-badge-red";
    textClass = "text-red-600";
    label = "Needs Work";
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 ${containerClass}`}
    >
      <p className={`text-sm font-medium ${textClass}`}>{label}</p>
    </div>
  );
};

export default ScoreBadge;
