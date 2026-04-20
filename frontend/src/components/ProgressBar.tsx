import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  labelClassName?: string;
  label?: string;
}

export const ProgressBar = ({ value, className, barClassName, labelClassName, label }: ProgressBarProps) => {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setWidth(value), 200);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {label && (
        <div className={cn("flex justify-center gap-4 mb-2 text-sm text-center", labelClassName)}>
          <span className="text-muted-foreground tracking-wide">{label}</span>
          <span className="text-primary font-semibold tabular-nums">{value}%</span>
        </div>
      )}
      <div className={cn("h-2 w-full rounded-full bg-secondary overflow-hidden relative", barClassName)}>
        <div
          className="h-full rounded-full bg-gold-gradient relative transition-[width] duration-[2000ms] ease-out"
          style={{ width: `${width}%`, boxShadow: "0 0 20px hsl(var(--primary) / 0.6)" }}
        >
          <div className="absolute inset-0 shimmer rounded-full" />
        </div>
      </div>
    </div>
  );
};
