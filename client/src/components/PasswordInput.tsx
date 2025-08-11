import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getPasswordStrength, getStrengthColor, getStrengthText } from "@/lib/passwordValidation";
import { Button } from "@/components/ui/button";

interface PasswordInputProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  className?: string;
  error?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Mot de passe",
  showStrength = true,
  className = "",
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${className}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-gray-400`}></i>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <i className="fas fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}

      {/* Password strength indicator */}
      {showStrength && value && (
        <div className="space-y-2">
          {/* Strength bar */}
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < strength.score ? getStrengthColor(strength.level) : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>

          {/* Strength text */}
          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-medium ${
                strength.level === "very-weak" || strength.level === "weak"
                  ? "text-red-500"
                  : strength.level === "medium"
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              Force: {getStrengthText(strength.level)}
            </span>

            {strength.level !== "very-strong" && (
              <span className="text-gray-500">
                {5 - strength.score} critère{5 - strength.score > 1 ? "s" : ""} manquant
                {5 - strength.score > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Feedback */}
          {strength.feedback.length > 0 && strength.level !== "very-strong" && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-medium">Améliorations suggérées:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                {strength.feedback.slice(0, 3).map((feedback, i) => (
                  <li key={i} className="flex items-center">
                    <i className="fas fa-circle text-xs mr-2 opacity-50"></i>
                    {feedback}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
