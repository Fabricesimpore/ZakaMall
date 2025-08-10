import { useDarkMode } from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";

interface DarkModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function DarkModeToggle({ className = "", showLabel = false }: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      aria-label={`Basculer vers le thème ${isDarkMode ? "clair" : "sombre"}`}
    >
      <div className="flex items-center space-x-2">
        {/* Sun/Moon icon with smooth transition */}
        <div className="relative w-5 h-5">
          <i
            className={`fas fa-sun absolute transition-all duration-300 ${
              isDarkMode
                ? "opacity-0 rotate-90 scale-0"
                : "opacity-100 rotate-0 scale-100 text-yellow-500"
            }`}
          ></i>
          <i
            className={`fas fa-moon absolute transition-all duration-300 ${
              isDarkMode
                ? "opacity-100 rotate-0 scale-100 text-blue-400"
                : "opacity-0 -rotate-90 scale-0"
            }`}
          ></i>
        </div>

        {showLabel && (
          <span className="text-sm font-medium">
            {isDarkMode ? "Mode clair" : "Mode sombre"}
          </span>
        )}
      </div>

      {/* Background animation */}
      <div
        className={`absolute inset-0 -z-10 transition-all duration-500 ${
          isDarkMode
            ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10"
            : "bg-gradient-to-r from-yellow-400/10 to-orange-400/10"
        } rounded-md`}
      ></div>
    </Button>
  );
}