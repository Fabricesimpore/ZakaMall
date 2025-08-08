import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { isUnauthorizedError } from "@/lib/authUtils";

const vendorSetupSchema = z.object({
  businessName: z.string().min(3, "Le nom de l'entreprise doit avoir au moins 3 caractères"),
  businessDescription: z.string().min(10, "La description doit avoir au moins 10 caractères"),
  businessAddress: z.string().min(10, "L'adresse complète est requise"),
  businessPhone: z.string()
    .min(8, "Numéro de téléphone professionnel requis")
    .regex(/^(\+226)?[0-9]{8}$/, "Format: +226XXXXXXXX ou 8 chiffres"),
  taxId: z.string().optional(),
  bankAccount: z.string().min(5, "Numéro de compte bancaire requis"),
  bankName: z.string().min(3, "Nom de la banque requis"),
  identityDocument: z.string().optional(),
  businessLicense: z.string().optional(),
});

type VendorSetupForm = z.infer<typeof vendorSetupSchema>;

export default function VendorSetup() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<VendorSetupForm>({
    resolver: zodResolver(vendorSetupSchema),
    defaultValues: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      businessPhone: "",
      taxId: "",
      bankAccount: "",
      bankName: "",
      identityDocument: "",
      businessLicense: "",
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: VendorSetupForm) => {
      return await apiRequest('POST', '/api/vendors', data);
    },
    onSuccess: () => {
      toast({
        title: "Demande soumise!",
        description: "Votre demande de vendeur sera examinée par notre équipe. Nous vous contacterons bientôt.",
      });
      // Redirect to pending approval page
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
    setupMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <Input placeholder="Boutique Maman Fatou" {...field} />
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
                            <Textarea 
                              placeholder="Décrivez vos produits et services..."
                              className="min-h-[100px]"
                              {...field} 
                            />
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
                          <FormLabel>Adresse complète *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Secteur, rue, ville..."
                              {...field} 
                            />
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
                            <Input placeholder="+22670123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations financières</h3>
                    
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banque *</FormLabel>
                          <FormControl>
                            <Input placeholder="Coris Bank, Ecobank, UBA..." {...field} />
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
                            <Input placeholder="Numéro de compte bancaire" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro d'identification fiscale (IFU)</FormLabel>
                          <FormControl>
                            <Input placeholder="00000000X (optionnel)" {...field} />
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
                            <Input 
                              placeholder="Numéro de la pièce d'identité"
                              {...field} 
                            />
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
                            <Input 
                              placeholder="Numéro du registre de commerce"
                              {...field} 
                            />
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep}
                    >
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