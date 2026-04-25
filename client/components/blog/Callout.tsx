import React from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, CheckCircle, Zap } from "lucide-react";

type CalloutType = "note" | "warning" | "tip" | "important";

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ElementType;
    bg: string;
    border: string;
    label: string;
  }
> = {
  note: {
    icon: Info,
    bg: "bg-[#e8f4ff] dark:bg-[#0c1e3d]",
    border: "border-[#0066cc]",
    label: "NOTE",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-[#fff8e0] dark:bg-[#231800]",
    border: "border-[#ff9900]",
    label: "WARNING",
  },
  tip: {
    icon: CheckCircle,
    bg: "bg-[#e0fff4] dark:bg-[#001f14]",
    border: "border-[#00cc66]",
    label: "TIP",
  },
  important: {
    icon: Zap,
    bg: "bg-[#ffe8e8] dark:bg-[#2a0a0a]",
    border: "border-[#ff4800]",
    label: "IMPORTANT",
  },
};

interface CalloutProps {
  type?: CalloutType;
  children: React.ReactNode;
}

export function Callout({ type = "note", children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-6 border-2 border-l-4 p-4 shadow-brutal text-white",
        config.bg,
        config.border,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="shrink-0" />
        <span className="text-xs font-black tracking-widest">
          {config.label}
        </span>
      </div>
      <div className="text-sm [&>p]:m-0">{children}</div>
    </div>
  );
}
