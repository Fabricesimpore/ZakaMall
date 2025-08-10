import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { isUnauthorizedError } from "@/lib/authUtils";

const vendorSetupSchema = z
  .object({
    businessName: z.string().min(3, "Le nom de l'entreprise doit avoir au moins 3 caractères"),
    businessDescription: z.string().min(10, "La description doit avoir au moins 10 caractères"),
    businessAddress: z.string().min(5, "Localisation de votre entreprise requise"),
    businessPhone: z
      .string()
      .min(8, "Numéro de téléphone professionnel requis")
      .regex(/^(\+226)?[0-9]{8}$/, "Format: +226XXXXXXXX ou 8 chiffres"),
    taxId: z.string().optional(),
    paymentMethod: z.enum(["bank", "orange", "moov"], {
      required_error: "Mode de paiement requis",
    }),
    // Bank fields (conditional)
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    // Mobile money fields (conditional)
    mobileMoneyNumber: z.string().optional(),
    mobileMoneyName: z.string().optional(),
    identityDocument: z.string().optional(),
    businessLicense: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "bank") {
        return (
          data.bankName &&
          data.bankAccount &&
          data.bankName.length >= 3 &&
          data.bankAccount.length >= 5
        );
      } else if (data.paymentMethod === "orange" || data.paymentMethod === "moov") {
        return (
          data.mobileMoneyNumber &&
          data.mobileMoneyName &&
          data.mobileMoneyNumber.length >= 8 &&
          data.mobileMoneyName.length >= 3
        );
      }
      return true;
    },
    {
      message: "Informations de paiement incomplètes",
      path: ["paymentMethod"], // Specify path to show error on payment method field
    }
  );

type VendorSetupForm = z.infer<typeof vendorSetupSchema>;

export default function VendorSetup() {
  console.log("🏪 VendorSetup component mounting");
  const [step, setStepState] = useState(1);

  // Debug step changes
  const setStep = (newStep: number) => {
    console.log(`📍 Step changing from ${step} to ${newStep}`);
    console.trace("Step change stack trace");
    setStepState(newStep);
  };
  const [_isSubmitting, _setIsSubmitting] = useState(false);
  const { user: _user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  console.log("🔐 Auth state:", { user: _user, authLoading, isAuthenticated });

  // Monitor step changes
  useEffect(() => {
    console.log(`🔄 useEffect: Step is now ${step}`);
    if (step === 3) {
      console.log("🎯 Step 3 reached! Monitoring for any automatic submissions...");
    }
  }, [step]);

  const form = useForm<VendorSetupForm>({
    resolver: zodResolver(vendorSetupSchema),
    defaultValues: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      businessPhone: "",
      taxId: "",
      paymentMethod: "bank",
      bankAccount: "",
      bankName: "",
      mobileMoneyNumber: "",
      mobileMoneyName: "",
      identityDocument: "",
      businessLicense: "",
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: VendorSetupForm) => {
      console.log("🚀 API request starting for vendor setup");
      return await apiRequest("POST", "/api/vendors", data);
    },
    onSuccess: () => {
      console.log("✅ Vendor setup mutation successful");
      toast({
        title: "Demande soumise!",
        description:
          "Votre demande de vendeur sera examinée par notre équipe. Nous vous contacterons bientôt.",
      });
      // Redirect to pending approval page
      console.log("🔄 Redirecting to vendor-pending page");
      window.location.href = "/vendor-pending";
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorSetupForm) => {
    console.log("Form submitted with data:", data);
    console.log("Current step when submitting:", step);

    // Only submit if we're on step 3
    if (step !== 3) {
      console.log("Form submission blocked - not on step 3");
      toast({
        title: "Erreur",
        description: "Veuillez compléter toutes les étapes avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    setupMutation.mutate(data);
  };

  const nextStep = async () => {
    if (step < 3) {
      // Validate current step before proceeding
      let fieldsToValidate: (keyof VendorSetupForm)[] = [];

      if (step === 1) {
        fieldsToValidate = [
          "businessName",
          "businessDescription",
          "businessAddress",
          "businessPhone",
        ];
      } else if (step === 2) {
        const paymentMethod = form.getValues("paymentMethod");
        fieldsToValidate = ["paymentMethod"];

        if (paymentMethod === "bank") {
          fieldsToValidate.push("bankName", "bankAccount");
        } else if (paymentMethod === "orange" || paymentMethod === "moov") {
          fieldsToValidate.push("mobileMoneyNumber", "mobileMoneyName");
        }
      }

      // Trigger validation for the current step fields
      const isStepValid = await form.trigger(fieldsToValidate);

      console.log(`Step ${step} validation result:`, isStepValid);
      console.log("Fields validated:", fieldsToValidate);
      console.log("Form values:", form.getValues());

      if (isStepValid) {
        console.log(`Moving from step ${step} to step ${step + 1}`);
        setStep(step + 1);
      } else {
        toast({
          title: "Champs requis",
          description: "Veuillez remplir tous les champs obligatoires avant de continuer",
          variant: "destructive",
        });
      }
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    console.log("⏳ VendorSetup: Auth is loading, showing spinner");
    return (
      <div className="min-h-screen bg-zaka-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-green mx-auto mb-4"></div>
          <p className="text-zaka-gray">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    console.log("❌ VendorSetup: User not authenticated");
    return (
      <div className="min-h-screen bg-zaka-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-zaka-gray mb-4">Vous devez être connecté pour accéder à cette page</p>
          <a href="/" className="text-zaka-green hover:underline">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  console.log("✅ VendorSetup: Rendering form");

  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-zaka-green bg-opacity-10 rounded-full flex items-center justify-center">
                  <i className="fas fa-store text-2xl text-zaka-green"></i>
                </div>
              </div>
              Inscription Vendeur - Étape {step}/3
            </CardTitle>
            <Progress value={(step / 3) * 100} className="w-full" />
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && step < 3) {
                    e.preventDefault();
                    console.log("Enter key prevented form submission on step", step);
                  }
                }}
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations sur l'entreprise</h3>

                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'entreprise *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description de l'activité *</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localisation de l'entreprise *</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone professionnel *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Mode de paiement</h3>
                    <p className="text-sm text-gray-600">
                      Choisissez comment vous souhaitez recevoir vos paiements
                    </p>

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de paiement *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir le mode de paiement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bank">🏦 Compte bancaire</SelectItem>
                              <SelectItem value="orange">🟠 Orange Money</SelectItem>
                              <SelectItem value="moov">🔵 Moov Money</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("paymentMethod") === "bank" && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900">Informations bancaires</h4>
                        <FormField
                          control={form.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom de la banque *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bankAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de compte *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {(form.watch("paymentMethod") === "orange" ||
                      form.watch("paymentMethod") === "moov") && (
                      <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-orange-900">
                          {form.watch("paymentMethod") === "orange" ? "Orange Money" : "Moov Money"}
                        </h4>
                        <FormField
                          control={form.control}
                          name="mobileMoneyNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Numéro{" "}
                                {form.watch("paymentMethod") === "orange"
                                  ? "Orange Money"
                                  : "Moov Money"}{" "}
                                *
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mobileMoneyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du titulaire du compte *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro d'identification fiscale (IFU)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Documents</h3>
                    <p className="text-sm text-gray-600">
                      Les documents peuvent être fournis plus tard ou envoyés par WhatsApp.
                    </p>

                    <FormField
                      control={form.control}
                      name="identityDocument"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pièce d'identité (CNI, Passeport)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registre du commerce (optionnel)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-zaka-light p-4 rounded-lg">
                      <h4 className="font-semibold text-zaka-dark mb-2">
                        <i className="fas fa-info-circle mr-2 text-zaka-blue"></i>
                        Processus d'approbation
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Examen de votre demande sous 24-48h</li>
                        <li>• Vérification des informations fournies</li>
                        <li>• Appel de confirmation</li>
                        <li>• Activation de votre compte vendeur</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Précédent
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="ml-auto bg-zaka-green hover:bg-zaka-green"
                    >
                      Suivant
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={setupMutation.isPending}
                      className="ml-auto bg-zaka-green hover:bg-zaka-green"
                    >
                      {setupMutation.isPending ? "Envoi en cours..." : "Soumettre la demande"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
