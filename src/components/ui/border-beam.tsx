
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BorderBeamProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const BorderBeam = ({ children, className, ...props }: BorderBeamProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm",
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-purple-500/10 before:to-cyan-500/10 before:opacity-0 before:transition-opacity hover:before:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
