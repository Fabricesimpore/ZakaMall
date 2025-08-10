import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PasswordInput from "@/components/PasswordInput";
import { getPasswordStrength } from "@/lib/passwordValidation";

export default function Register() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength
    const passwordStrength = getPasswordStrength(password);
    if (passwordStrength.level === 'very-weak' || passwordStrength.level === 'weak') {
      toast({
        title: "Mot de passe trop faible",
        description: "Veuillez choisir un mot de passe plus fort selon les critères indiqués",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role: "customer",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerificationSent(true);
        toast({
          title: "Code envoyé",
          description: "Un code de vérification a été envoyé à votre email.",
        });
      } else {
        throw new Error(data.message || "Échec de l'inscription");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'inscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès. Connectez-vous maintenant.",
        });
        setLocation("/");
      } else {
        throw new Error(data.message || "Code invalide");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de vérification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              {isVerificationSent
                ? "Entrez le code de vérification envoyé à votre email"
                : "Inscrivez-vous pour accéder à ZakaMall"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isVerificationSent ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    showStrength={true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirmez votre mot de passe"
                    showStrength={false}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Inscription..." : "S'inscrire"}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Déjà un compte?{" "}
                  <a href="/" className="text-primary hover:underline">
                    Se connecter
                  </a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Code de vérification</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Vérifiez votre email pour le code à 6 chiffres
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Vérification..." : "Vérifier"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsVerificationSent(false)}
                >
                  Retour
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
