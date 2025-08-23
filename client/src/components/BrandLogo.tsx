import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function BrandLogo({
  className,
  showSubtitle = false,
  size = "md",
}: BrandLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <a className="flex flex-col items-start" aria-label="ZakaMall - Accueil">
        <span
          className={cn("font-bold text-zaka-orange whitespace-nowrap", sizeClasses[size])}
          style={{ letterSpacing: "-0.02em" }}
        >
          ZakaMall
        </span>
        {showSubtitle && (
          <span className="text-xs text-gray-500 whitespace-nowrap">Marketplace du Burkina</span>
        )}
      </a>
    </Link>
  );
}
