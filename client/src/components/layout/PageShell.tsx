import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  containerSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  noPadding?: boolean;
  fullWidth?: boolean;
}

export default function PageShell({
  children,
  className,
  containerSize = "2xl",
  noPadding = false,
  fullWidth = false,
}: PageShellProps) {
  if (fullWidth) {
    return (
      <div className={cn("min-h-screen w-full overflow-x-hidden", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen w-full overflow-x-hidden", className)}>
      <Container size={containerSize} className={noPadding ? "px-0" : ""}>
        {children}
      </Container>
    </div>
  );
}