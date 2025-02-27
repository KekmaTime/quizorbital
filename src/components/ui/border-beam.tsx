import React from "react";
import { cn } from "@/lib/utils";

interface BorderBeamProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const BorderBeam = ({ children, className, ...props }: BorderBeamProps) => {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-gray-800 bg-black p-1 transition-all hover:border-purple-400/50",
        className
      )}
      {...props}
    >
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 blur transition-all group-hover:opacity-30" />
      <div className="relative rounded-lg bg-black">{children}</div>
    </div>
  );
};
