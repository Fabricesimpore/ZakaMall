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

// Phone number schema for Burkina Faso
const phoneSignupSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  phone: z
    .string()
    .min(8, "Le numéro de téléphone doit avoir 8 chiffres")
    .max(8, "Le numéro de téléphone doit avoir 8 chiffres")
    .regex(/^[0-9]{8}$/, "Le numéro doit contenir uniquement des chiffres"),
  operator: z.enum(["orange", "moov"], { required_error: "Veuillez choisir votre opérateur" }),
  role: z.enum(["customer", "vendor", "driver"], { required_error: "Veuillez choisir votre rôle" }),
});

type PhoneSignupForm = z.infer<typeof phoneSignupSchema>;

interface PhoneSignupProps {
  onSuccess: () => void;
}

export default function PhoneSignup({ onSuccess }: PhoneSignupProps) {
  const [step, setStep] = useState(1);
  // const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();

  const form = useForm<PhoneSignupForm>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      operator: "orange",
      role: "customer",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: PhoneSignupForm) => {
      const fullPhone = `+226${data.phone}`;
      return await apiRequest("POST", "/api/auth/phone-signup", {
        ...data,
        phone: fullPhone,
      });
    },
    onSuccess: () => {
      toast({
        title: "Code envoyé!",
        description: "Un code de vérification a été envoyé à votre téléphone",
      });
      setStep(2);
    },
    onError: () => {
      toast({
        title: "Erreur d'inscription",
        description: "Impossible de créer le compte",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      return await apiRequest("POST", "/api/auth/verify-phone", { phone, code });
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
        // Customer role goes directly to login
        window.location.href = "/api/login";
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

  const onSubmit = (data: PhoneSignupForm) => {
    signupMutation.mutate(data);
  };

  const handleVerification = () => {
    const phoneData = form.getValues();
    const fullPhone = `+226${phoneData.phone}`;
    verifyMutation.mutate({ phone: fullPhone, code: verificationCode });
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length >= 4) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)}`;
    }
    return cleaned;
  };

  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-mobile-alt text-2xl text-zaka-orange"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Vérification du téléphone</h3>
          <p className="text-sm text-gray-600">
            Entrez le code à 6 chiffres envoyé au numéro
            <br />
            <strong>+226 {formatPhoneDisplay(form.getValues("phone"))}</strong>
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
              Modifier le numéro
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
          name="operator"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opérateur mobile</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir votre opérateur" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="orange">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      Orange Burkina Faso
                    </div>
                  </SelectItem>
                  <SelectItem value="moov">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      Moov Africa
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone</FormLabel>
              <FormControl>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    +226
                  </span>
                  <Input
                    placeholder="70123456"
                    {...field}
                    value={formatPhoneDisplay(field.value)}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      if (cleaned.length <= 8) {
                        field.onChange(cleaned);
                      }
                    }}
                    className="rounded-l-none"
                  />
                </div>
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
