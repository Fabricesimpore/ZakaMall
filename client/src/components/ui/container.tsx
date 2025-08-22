import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article" | "main";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const containerSizes = {
  sm: "max-w-screen-sm", // 640px
  md: "max-w-screen-md", // 768px
  lg: "max-w-screen-lg", // 1024px
  xl: "max-w-screen-xl", // 1280px
  "2xl": "max-w-screen-2xl", // 1536px
  full: "max-w-full",
};

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, as: Component = "div", size = "2xl", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", containerSizes[size], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = "Container";

export { Container };
