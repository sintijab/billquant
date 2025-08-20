import { cn } from "@/lib/utils";


interface LoaderProps {
  className?: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg";
}

const Loader = ({ className, size = "md" }: LoaderProps) => {
  const sizeClasses = {
    xxs: "w-1 h-1",
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  // Animation delays in seconds, matching the SCSS
  const delays = [1.8, 2.1, 2.4, 0.9, 1.2, 1.5, 0, 0.3, 0.6];

  return (
    <div
      className={cn(
        "grid grid-cols-3 grid-rows-3 gap-1 w-fit h-fit",
        className
      )}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className={cn(
            sizeClasses[size],
            "rounded-sm animate-loader-enter",
            i === 2 ? "bg-yellow-300" : "bg-loader-accent"
          )}
          style={{
            animationDelay: `${delays[i]}s`
          }}
        />
      ))}
    </div>
  );
};

export default Loader;