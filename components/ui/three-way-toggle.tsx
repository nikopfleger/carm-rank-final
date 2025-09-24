import { cn } from "@/lib/utils";

type Value = "left" | "center" | "right";
type Size = "sm" | "md";

interface Props {
  leftLabel: string;
  centerLabel: string;
  rightLabel: string;
  value: Value;
  onChange(val: Value): void;
  size?: Size;
  className?: string;
}

export function ThreeWayToggle({
  leftLabel,
  centerLabel,
  rightLabel,
  value,
  onChange,
  size = "md",
  className
}: Props) {
  const index = value === "left" ? 0 : value === "center" ? 1 : 2;

  const height = size === "sm" ? "h-9" : "h-11";
  const textSize = size === "sm" ? "text-sm" : "text-base";
  const segmentClass =
    "relative z-10 flex items-center justify-center cursor-pointer select-none";

  return (
    <div
      className={cn(
        "relative w-[300px] rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden",
        height,
        className
      )}
      role="tablist"
      aria-label="three-way-toggle"
    >
      {/* Highlight que se mueve exactamente por segmentos 0/33.333/66.666 */}
      <div
        className={cn(
          "absolute top-0 h-full w-1/3 rounded-full bg-white dark:bg-gray-700 shadow transition-all duration-300 ease-out"
        )}
        style={{ left: `${index * 33.333333}%` }}
        aria-hidden
      />

      <div className="grid grid-cols-3 h-full relative z-10">
        <button
          type="button"
          role="tab"
          aria-selected={value === "left"}
          className={cn(
            segmentClass,
            textSize,
            value === "left" ? "font-semibold" : "opacity-70"
          )}
          onClick={() => onChange("left")}
        >
          {leftLabel}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={value === "center"}
          className={cn(
            segmentClass,
            textSize,
            value === "center" ? "font-semibold" : "opacity-70"
          )}
          onClick={() => onChange("center")}
        >
          {centerLabel}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={value === "right"}
          className={cn(
            segmentClass,
            textSize,
            value === "right" ? "font-semibold" : "opacity-70"
          )}
          onClick={() => onChange("right")}
        >
          {rightLabel}
        </button>
      </div>
    </div>
  );
}
