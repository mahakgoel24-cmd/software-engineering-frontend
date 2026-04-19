import { Sparkles, Info } from "lucide-react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

interface InsightBadgeProps {
  score?: number;
  value?: string;
  label: string;
  type?: "fit" | "risk" | "quality";
}

export function InsightBadge({ score, value, label, type = "fit" }: InsightBadgeProps) {
  return (
    <div className="relative inline-flex items-center group cursor-help">
      <Badge variant="ml" className="pl-1.5 pr-2.5 py-1 gap-1.5 inline-flex items-center">
        <Sparkles className="w-3 h-3 flex-shrink-0" />
        {value ? (
          <span className="font-bold">{value}</span>
        ) : score ? (
          <span className="font-bold">{score}%</span>
        ) : null}
        <span className="font-medium opacity-90">{label}</span>
      </Badge>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900 text-white text-xs px-3 py-2 rounded-md shadow-xl max-w-xs z-50 pointer-events-none whitespace-nowrap">
        ML-generated insight based on skill matching and past performance.
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900" />
      </div>
    </div>
  );
}
