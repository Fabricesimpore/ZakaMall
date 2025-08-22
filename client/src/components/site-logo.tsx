import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  variant?: "brand" | "currentColor";
}

export function SiteLogo({ className, variant = "brand" }: SiteLogoProps) {
  const wordmark =
    variant === "currentColor" ? "/zakaMall-wordmark-currentColor.svg" : "/zakaMall-wordmark.svg";

  return (
    <Link href="/" className={cn("flex items-center gap-2 min-w-0", className)}>
      <a className="flex items-center gap-2 min-w-0" aria-label="ZakaMall - Accueil">
        <div className="relative shrink-0 w-7 h-7">
          <img
            src="/zakaMall-icon.svg"
            alt=""
            className="object-contain w-full h-full"
            width={28}
            height={28}
          />
        </div>
        <div className="relative min-w-0 w-[140px] sm:w-[180px] md:w-[220px] h-7 md:h-9">
          <img
            src={wordmark}
            alt="ZakaMall"
            className="object-contain w-full h-full"
            width={220}
            height={36}
          />
        </div>
      </a>
    </Link>
  );
}
