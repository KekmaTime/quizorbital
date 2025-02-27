
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LampContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const LampContainer = ({ children, className, ...props }: LampContainerProps) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[350px] flex-col items-center justify-center overflow-hidden bg-black",
        className
      )}
      {...props}
    >
      <div className="relative flex w-full flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto right-1/2 h-56 w-[30rem] translate-x-1/2 translate-y-[-120%] transform-gpu bg-gradient-to-r from-purple-500 to-cyan-500 blur-[100px]"
        />
        {children}
      </div>
    </div>
  );
};
