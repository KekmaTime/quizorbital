import React from "react";
import { cn } from "@/lib/utils";

interface SectionBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SectionBadge = ({ children, className, ...props }: SectionBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
