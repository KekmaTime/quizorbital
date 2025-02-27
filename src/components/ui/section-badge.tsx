
import { cn } from "@/lib/utils";

interface SectionBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SectionBadge = ({ children, className, ...props }: SectionBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-white/10 px-4 py-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
