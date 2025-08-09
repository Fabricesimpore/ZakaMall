import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Email signup schema
const emailSignupSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères"),
  role: z.enum(["customer", "vendor", "driver"], { required_error: "Veuillez choisir votre rôle" }),
});

type EmailSignupForm = z.infer<typeof emailSignupSchema>;

interface EmailSignupProps {
  onSuccess: () => void;
}

export default function EmailSignup({ onSuccess }: EmailSignupProps) {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();

  const form = useForm<EmailSignupForm>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "customer",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: EmailSignupForm) => {
      return await apiRequest("POST", "/api/auth/email-signup", data);
    },
    onSuccess: () => {
      toast({
        title: "Code envoyé!",
        description: "Un code de vérification a été envoyé à votre email",
      });
      setStep(2);
    },
    onError: (_error: Error) => {
      toast({
        title: "Erreur d'inscription",
        description: _error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      return await apiRequest("POST", "/api/auth/verify-email", { email, code });
    },
    onSuccess: () => {
      toast({
        title: "Compte créé avec succès!",
        description: "Vous pouvez maintenant compléter votre profil",
      });
      onSuccess();

      // Redirect based on user role to setup pages
      const userData = form.getValues();
      if (userData.role === "vendor") {
        window.location.href = "/vendor-setup";
      } else if (userData.role === "driver") {
        window.location.href = "/driver-setup";
      } else {
        // Customer role goes to home page - they can login from there
        window.location.href = "/";
      }
    },
    onError: () => {
      toast({
        title: "Code incorrect",
        description: "Le code de vérification est invalide ou expiré",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailSignupForm) => {
    signupMutation.mutate(data);
  };

  const handleVerification = () => {
    const emailData = form.getValues();
    verifyMutation.mutate({ email: emailData.email, code: verificationCode });
  };

  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-envelope text-2xl text-zaka-orange"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Vérification de l'email</h3>
          <p className="text-sm text-gray-600">
            Entrez le code à 6 chiffres envoyé à<br />
            <strong>{form.getValues("email")}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Code de vérification</label>
            <Input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>

          <Button
            onClick={handleVerification}
            disabled={verificationCode.length !== 6 || verifyMutation.isPending}
            className="w-full bg-zaka-orange hover:bg-zaka-orange"
          >
            {verifyMutation.isPending ? "Vérification..." : "Vérifier"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-zaka-orange hover:underline"
            >
              Modifier l'email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Ouédraogo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jean.ouedraogo@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Je veux devenir</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir votre rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">
                    <div className="flex items-center">
                      <i className="fas fa-shopping-cart text-zaka-blue mr-2"></i>
                      Client - Faire des achats
                    </div>
                  </SelectItem>
                  <SelectItem value="vendor">
                    <div className="flex items-center">
                      <i className="fas fa-store text-zaka-green mr-2"></i>
                      Vendeur - Vendre mes produits
                    </div>
                  </SelectItem>
                  <SelectItem value="driver">
                    <div className="flex items-center">
                      <i className="fas fa-motorcycle text-zaka-orange mr-2"></i>
                      Livreur - Faire des livraisons
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full bg-zaka-orange hover:bg-zaka-orange"
        >
          {signupMutation.isPending ? "Création du compte..." : "Créer mon compte"}
        </Button>

        <div className="text-center text-xs text-gray-500">
          En vous inscrivant, vous acceptez nos{" "}
          <a href="#" className="text-zaka-orange hover:underline">
            conditions d'utilisation
          </a>{" "}
          et notre{" "}
          <a href="#" className="text-zaka-orange hover:underline">
            politique de confidentialité
          </a>
        </div>
      </form>
    </Form>
  );
}
