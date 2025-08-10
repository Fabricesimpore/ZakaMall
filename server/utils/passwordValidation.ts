// Server-side password validation utility
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  // Check minimum length
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins 8 caractères",
    };
  }

  // Check maximum length
  if (password.length > 128) {
    return {
      isValid: false,
      message: "Le mot de passe ne peut pas dépasser 128 caractères",
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins une lettre minuscule",
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins une lettre majuscule",
    };
  }

  // Check for digit
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins un chiffre",
    };
  }

  // Check for special character
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)",
    };
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe ne doit pas contenir plus de 2 caractères identiques consécutifs",
    };
  }

  // Check for common weak passwords
  const weakPatterns = [
    /123/i,
    /abc/i,
    /qwe/i,
    /azer/i,
    /password/i,
    /motdepasse/i,
    /admin/i,
    /user/i,
    /test/i,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return {
        isValid: false,
        message: "Le mot de passe ne doit pas contenir de séquences communes ou de mots évidents",
      };
    }
  }

  return { isValid: true };
}
