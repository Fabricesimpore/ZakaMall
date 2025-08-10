import { z } from "zod";

// Strong password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(/[^a-zA-Z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)")
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères");

// Password strength checker
export function getPasswordStrength(password: string): {
  score: number;
  level: "very-weak" | "weak" | "medium" | "strong" | "very-strong";
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push("Au moins 8 caractères");

  if (password.length >= 12) score += 1;

  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Au moins une lettre minuscule");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Au moins une lettre majuscule");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Au moins un chiffre");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Au moins un caractère spécial (!@#$%^&*)");

  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push("Évitez les caractères répétitifs");
  }

  if (/123|abc|qwe|azer|password|motdepasse/i.test(password)) {
    score -= 2;
    feedback.push("Évitez les séquences communes ou mots évidents");
  }

  // Determine level
  let level: "very-weak" | "weak" | "medium" | "strong" | "very-strong";
  if (score <= 1) level = "very-weak";
  else if (score <= 2) level = "weak";
  else if (score <= 3) level = "medium";
  else if (score <= 4) level = "strong";
  else level = "very-strong";

  return { score: Math.max(0, score), level, feedback };
}

// Get color for password strength
export function getStrengthColor(level: string): string {
  switch (level) {
    case "very-weak":
      return "bg-red-500";
    case "weak":
      return "bg-red-400";
    case "medium":
      return "bg-yellow-400";
    case "strong":
      return "bg-green-400";
    case "very-strong":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
}

// Get text for password strength
export function getStrengthText(level: string): string {
  switch (level) {
    case "very-weak":
      return "Très faible";
    case "weak":
      return "Faible";
    case "medium":
      return "Moyen";
    case "strong":
      return "Fort";
    case "very-strong":
      return "Très fort";
    default:
      return "Invalide";
  }
}
