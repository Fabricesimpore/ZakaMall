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
    shopName: z.string().min(3, "Le nom de la boutique doit avoir au moins 3 caractères"),
    businessDescription: z.string().min(10, "La description doit avoir au moins 10 caractères"),
    businessAddress: z.string().min(5, "Localisation de votre entreprise requise"),
    businessPhone: z
      .string()
      .min(12, "Numéro de téléphone professionnel requis")
      .regex(/^\+226 \d{2} \d{2} \d{2} \d{2}$/, "Format requis: +226 XX XX XX XX"),
    taxId: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // Optional field
          // IFU format in Burkina Faso: 8 digits
          return /^\d{8}$/.test(val);
        },
        {
          message: "L'IFU doit contenir exactement 8 chiffres",
        }
      ),
    paymentMethod: z.enum(["bank", "orange", "moov"], {
      required_error: "Mode de paiement requis",
    }),
    // Bank fields (conditional)
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    // Mobile money fields (conditional)
    mobileMoneyNumber: z.string().optional(),
    mobileMoneyName: z.string().optional(),
    identityDocument: z
      .string()
      .min(1, "Le numéro de pièce d'identité est requis")
      .refine(
        (val) => {
          // CNI format in Burkina Faso: 1 letter + 8 digits (e.g., B12345678)
          // Passport format: 2 letters + 7 digits (e.g., BF1234567)
          return /^[A-Z]\d{8}$/.test(val) || /^[A-Z]{2}\d{7}$/.test(val);
        },
        {
          message: "Format CNI: B12345678 ou Passeport: BF1234567",
        }
      ),
    identityDocumentPhoto: z.string().min(1, "La photo de la pièce d'identité est requise"),
    businessLicense: z.string().optional(),
    businessLicensePhoto: z.string().optional(),
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
  const [canSubmit, setCanSubmit] = useState(false);

  // Debug step changes
  const setStep = (newStep: number) => {
    console.log(`📍 Step changing to ${newStep}`);
    console.trace("Step change stack trace");
    setStepState(newStep);

    // Only allow submission when actually on step 3
    setCanSubmit(newStep === 3);
  };
  const [_isSubmitting, _setIsSubmitting] = useState(false);
  const { user: _user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  console.log("🔐 Auth state:", { user: _user, authLoading, isAuthenticated });

  const form = useForm<VendorSetupForm>({
    resolver: zodResolver(vendorSetupSchema),
    defaultValues: {
      businessName: "",
      shopName: "",
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
      identityDocumentPhoto: "",
      businessLicense: "",
      businessLicensePhoto: "",
    },
  });

  // Monitor step changes (after form is declared)
  useEffect(() => {
    console.log(`🔄 useEffect: Step is now ${step}`);
    if (step === 3) {
      console.log("🎯 Step 3 reached! Monitoring for any automatic submissions...");

      // Add a timeout to see if anything happens automatically
      const timer = setTimeout(() => {
        console.log("⏰ 3 seconds passed on step 3, checking if form was submitted");
        console.log("Form errors:", form.formState.errors);
        console.log("Form is valid:", form.formState.isValid);
        console.log("Form submitted count:", form.formState.submitCount);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [step, form.formState]);

  const setupMutation = useMutation({
    mutationFn: async (data: VendorSetupForm) => {
      console.log("🚀 API request starting for vendor setup");

      // Map form fields to match backend schema
      const vendorData = {
        // Map to new field names
        storeName: data.shopName,
        legalName: data.businessName,
        contactEmail: user?.email || "",
        contactPhone: data.businessPhone,
        countryCode: "BF",

        // Keep old fields for backward compatibility
        businessName: data.businessName,
        shopName: data.shopName,
        businessDescription: data.businessDescription,
        businessAddress: data.businessAddress,
        businessPhone: data.businessPhone,

        // Tax and payment info
        taxId: data.taxId,
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        mobileMoneyNumber: data.mobileMoneyNumber,
        mobileMoneyName: data.mobileMoneyName,

        // Documents
        identityDocument: data.identityDocument,
        identityDocumentPhoto: data.identityDocumentPhoto,
        businessLicense: data.businessLicense,
        businessLicensePhoto: data.businessLicensePhoto,

        // Payment method
        paymentMethod: data.paymentMethod,

        // Set status to pending for approval
        status: "pending",
      };

      console.log("📦 Sending vendor data:", vendorData);
      const response = await apiRequest("POST", "/api/vendors", vendorData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit vendor request");
      }

      return response.json();
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
      console.error("❌ Vendor setup error:", error);

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

      // Show specific error message
      const errorMessage =
        error.message || "Impossible de soumettre votre demande. Veuillez réessayer.";
      toast({
        title: "Erreur de soumission",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorSetupForm) => {
    console.log("🚨 Form submission attempted!");
    console.log("Form submitted with data:", data);
    console.log("Current step when submitting:", step);
    console.log("Can submit flag:", canSubmit);

    // Block submission unless explicitly allowed
    if (!canSubmit || step !== 3) {
      console.log("❌ Form submission BLOCKED - not ready for submission");
      console.log(`Step: ${step}, canSubmit: ${canSubmit}`);
      toast({
        title: "Erreur",
        description: "Veuillez compléter toutes les étapes avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Form submission ALLOWED - proceeding with mutation");
    setupMutation.mutate(data);
  };

  const nextStep = async () => {
    if (step <= 3) {
      // Validate current step before proceeding
      let fieldsToValidate: (keyof VendorSetupForm)[] = [];

      if (step === 1) {
        fieldsToValidate = [
          "businessName",
          "shopName",
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
      } else if (step === 3) {
        fieldsToValidate = ["identityDocument", "identityDocumentPhoto"];
      }

      // Manual validation to avoid automatic form submission
      const formValues = form.getValues();
      console.log("Form values before validation:", formValues);

      let isStepValid = true;
      let missingFields: string[] = [];

      // Manual validation for each step
      if (step === 1) {
        if (!formValues.businessName || formValues.businessName.length < 3) {
          isStepValid = false;
          missingFields.push("Nom de l'entreprise");
        }
        if (!formValues.shopName || formValues.shopName.length < 3) {
          isStepValid = false;
          missingFields.push("Nom de la boutique");
        }
        if (!formValues.businessDescription || formValues.businessDescription.length < 10) {
          isStepValid = false;
          missingFields.push("Description");
        }
        if (!formValues.businessAddress || formValues.businessAddress.length < 5) {
          isStepValid = false;
          missingFields.push("Adresse");
        }
        if (
          !formValues.businessPhone ||
          formValues.businessPhone.length < 12 ||
          !formValues.businessPhone.match(/^\+226 \d{2} \d{2} \d{2} \d{2}$/)
        ) {
          isStepValid = false;
          missingFields.push("Téléphone (format: +226 XX XX XX XX)");
        }
      } else if (step === 2) {
        if (!formValues.paymentMethod) {
          isStepValid = false;
          missingFields.push("Mode de paiement");
        } else if (formValues.paymentMethod === "bank") {
          if (!formValues.bankName || formValues.bankName.length < 3) {
            isStepValid = false;
            missingFields.push("Nom de la banque");
          }
          if (!formValues.bankAccount || formValues.bankAccount.length < 5) {
            isStepValid = false;
            missingFields.push("Numéro de compte");
          }
        } else if (formValues.paymentMethod === "orange" || formValues.paymentMethod === "moov") {
          if (!formValues.mobileMoneyNumber || formValues.mobileMoneyNumber.length < 8) {
            isStepValid = false;
            missingFields.push("Numéro mobile money");
          }
          if (!formValues.mobileMoneyName || formValues.mobileMoneyName.length < 3) {
            isStepValid = false;
            missingFields.push("Nom titulaire");
          }
        }
      } else if (step === 3) {
        if (
          !formValues.identityDocument ||
          !formValues.identityDocument.match(/^[A-Z]\d{8}$|^[A-Z]{2}\d{7}$/)
        ) {
          isStepValid = false;
          missingFields.push("Numéro de pièce d'identité valide");
        }
        if (!formValues.identityDocumentPhoto) {
          isStepValid = false;
          missingFields.push("Photo de la pièce d'identité");
        }
      }

      console.log(`Step ${step} manual validation result:`, isStepValid);
      console.log("Missing fields:", missingFields);

      if (isStepValid) {
        console.log(`✅ Moving from step ${step} to step ${step + 1}`);
        setStep(step + 1);
      } else {
        toast({
          title: "Champs requis",
          description: `Veuillez remplir: ${missingFields.join(", ")}`,
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
                      name="shopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la boutique *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Boutique Chez Marie" />
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
                            <Input
                              {...field}
                              placeholder="+226 XX XX XX XX"
                              autoComplete="off"
                              type="tel"
                              onChange={(e) => {
                                let value = e.target.value;
                                
                                // Remove all non-digit characters except spaces after +226
                                let cleanValue = value.replace(/[^\d\s+]/g, "");
                                
                                // Extract just the digits (removing +226 prefix and spaces)
                                let digitsOnly = cleanValue.replace(/^\+?226\s?/, "").replace(/\D/g, "");
                                
                                // Limit to 8 digits
                                if (digitsOnly.length > 8) {
                                  digitsOnly = digitsOnly.slice(0, 8);
                                }
                                
                                // Format as +226 XX XX XX XX
                                let formatted = "+226";
                                if (digitsOnly.length > 0) {
                                  formatted += " ";
                                  if (digitsOnly.length <= 2) {
                                    formatted += digitsOnly;
                                  } else if (digitsOnly.length <= 4) {
                                    formatted += digitsOnly.slice(0, 2) + " " + digitsOnly.slice(2);
                                  } else if (digitsOnly.length <= 6) {
                                    formatted += digitsOnly.slice(0, 2) + " " + digitsOnly.slice(2, 4) + " " + digitsOnly.slice(4);
                                  } else {
                                    formatted += digitsOnly.slice(0, 2) + " " + digitsOnly.slice(2, 4) + " " + 
                                                digitsOnly.slice(4, 6) + " " + digitsOnly.slice(6, 8);
                                  }
                                }
                                
                                field.onChange(formatted);
                              }}
                              onFocus={(e) => {
                                // Only add +226 if field is completely empty
                                if (!e.target.value || e.target.value === "") {
                                  field.onChange("+226 ");
                                }
                              }}
                            />
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
                          <FormLabel className="flex items-center">
                            <i className="fas fa-building mr-2 text-gray-500"></i>
                            Numéro d'identification fiscale (IFU) - Optionnel
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: 12345678 (8 chiffres)"
                              onChange={(e) => {
                                // Allow only digits and limit to 8
                                const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            8 chiffres - Peut être fourni plus tard
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">Vérification d'identité</h3>
                      <p className="text-sm text-gray-600">
                        Pour la sécurité de la plateforme, nous devons vérifier votre identité.
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <i className="fas fa-shield-alt text-blue-600 mr-2"></i>
                        <span className="font-medium text-blue-800">
                          Pourquoi vérifier votre identité ?
                        </span>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Protège les clients contre la fraude</li>
                        <li>• Augmente la confiance des acheteurs</li>
                        <li>• Respecte la réglementation burkinabè</li>
                      </ul>
                    </div>

                    <FormField
                      control={form.control}
                      name="identityDocument"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <i className="fas fa-id-card mr-2 text-zaka-orange"></i>
                            Numéro de pièce d'identité *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: B12345678 (CNI) ou BF1234567 (Passeport)"
                              onChange={(e) => {
                                // Auto-format to uppercase
                                field.onChange(e.target.value.toUpperCase());
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Format accepté: CNI (B12345678) ou Passeport (BF1234567)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="identityDocumentPhoto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <i className="fas fa-camera mr-2 text-zaka-orange"></i>
                            Photo de la pièce d'identité *
                          </FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-zaka-orange transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // For now, we'll use a placeholder URL
                                    // In production, this would upload to Cloudinary
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      field.onChange(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                                id="identity-photo"
                              />
                              <label htmlFor="identity-photo" className="cursor-pointer">
                                {field.value ? (
                                  <div className="space-y-2">
                                    <img
                                      src={field.value}
                                      alt="Pièce d'identité"
                                      className="max-h-32 mx-auto rounded-lg"
                                    />
                                    <p className="text-green-600 font-medium">
                                      <i className="fas fa-check-circle mr-1"></i>
                                      Photo téléchargée
                                    </p>
                                    <p className="text-xs text-gray-500">Cliquez pour changer</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                                    <p className="text-gray-600 font-medium">
                                      Cliquez pour télécharger votre pièce d'identité
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      JPG, PNG ou PDF - Max 5MB
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>
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
                          <FormLabel className="flex items-center">
                            <i className="fas fa-certificate mr-2 text-gray-500"></i>
                            Registre du commerce (optionnel)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Numéro du registre du commerce" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessLicensePhoto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <i className="fas fa-camera mr-2 text-gray-500"></i>
                            Photo du registre du commerce (optionnel)
                          </FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      field.onChange(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                                id="license-photo"
                              />
                              <label htmlFor="license-photo" className="cursor-pointer">
                                {field.value ? (
                                  <div className="space-y-2">
                                    <img
                                      src={field.value}
                                      alt="Registre du commerce"
                                      className="max-h-24 mx-auto rounded-lg"
                                    />
                                    <p className="text-green-600 text-sm">Photo téléchargée</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <i className="fas fa-plus text-2xl text-gray-400"></i>
                                    <p className="text-sm text-gray-600">Ajouter une photo</p>
                                  </div>
                                )}
                              </label>
                            </div>
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
                      type="button"
                      onClick={() => {
                        console.log("🎯 Manual submit button clicked on step 3");
                        setCanSubmit(true);
                        const formData = form.getValues();
                        onSubmit(formData);
                      }}
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
