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

const driverSetupSchema = z.object({
  vehicleType: z.enum(["moto", "voiture", "tricycle"], {
    required_error: "Type de véhicule requis",
  }),
  licenseNumber: z.string().min(5, "Numéro de permis de conduire requis"),
  vehicleModel: z.string().min(3, "Modèle du véhicule requis"),
  vehicleYear: z.string().regex(/^(19|20)\d{2}$/, "Année valide requise (ex: 2020)"),
  vehicleColor: z.string().min(3, "Couleur du véhicule requise"),
  vehiclePlate: z.string().min(5, "Plaque d'immatriculation requise"),
  emergencyContact: z.string().min(8, "Contact d'urgence requis"),
  emergencyName: z.string().min(3, "Nom du contact d'urgence requis"),
  workZone: z.string().min(5, "Zone de travail préférée requise"),
  experience: z.enum(["nouveau", "1-2ans", "3-5ans", "plus5ans"], {
    required_error: "Expérience requise",
  }),
});

type DriverSetupForm = z.infer<typeof driverSetupSchema>;

export default function DriverSetup() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<DriverSetupForm>({
    resolver: zodResolver(driverSetupSchema),
    defaultValues: {
      vehicleType: "moto",
      licenseNumber: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleColor: "",
      vehiclePlate: "",
      emergencyContact: "",
      emergencyName: "",
      workZone: "",
      experience: "nouveau",
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: DriverSetupForm) => {
      return await apiRequest("POST", "/api/drivers", data);
    },
    onSuccess: () => {
      toast({
        title: "Demande soumise!",
        description:
          "Votre demande de livreur sera examinée par notre équipe. Nous vous contacterons bientôt.",
      });
      // Redirect to pending approval page
      window.location.href = "/driver-pending";
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

  const onSubmit = (data: DriverSetupForm) => {
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
                <div className="w-12 h-12 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center">
                  <i className="fas fa-motorcycle text-2xl text-zaka-orange"></i>
                </div>
              </div>
              Inscription Livreur - Étape {step}/3
            </CardTitle>
            <Progress value={(step / 3) * 100} className="w-full" />
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations sur le véhicule</h3>

                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de véhicule *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="moto">
                                <div className="flex items-center">
                                  <i className="fas fa-motorcycle mr-2"></i>
                                  Moto
                                </div>
                              </SelectItem>
                              <SelectItem value="tricycle">
                                <div className="flex items-center">
                                  <i className="fas fa-shipping-fast mr-2"></i>
                                  Tricycle
                                </div>
                              </SelectItem>
                              <SelectItem value="voiture">
                                <div className="flex items-center">
                                  <i className="fas fa-car mr-2"></i>
                                  Voiture
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
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marque et modèle *</FormLabel>
                          <FormControl>
                            <Input placeholder="Honda CB, Yamaha YBR, Toyota..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Année *</FormLabel>
                            <FormControl>
                              <Input placeholder="2020" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vehicleColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Couleur *</FormLabel>
                            <FormControl>
                              <Input placeholder="Rouge, Noir..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="vehiclePlate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plaque d'immatriculation *</FormLabel>
                          <FormControl>
                            <Input placeholder="11 BF 0000 11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Permis et expérience</h3>

                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de permis de conduire *</FormLabel>
                          <FormControl>
                            <Input placeholder="Numéro du permis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expérience de conduite *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir l'expérience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="nouveau">Nouveau conducteur</SelectItem>
                              <SelectItem value="1-2ans">1-2 ans d'expérience</SelectItem>
                              <SelectItem value="3-5ans">3-5 ans d'expérience</SelectItem>
                              <SelectItem value="plus5ans">Plus de 5 ans d'expérience</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone de travail préférée *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Secteurs où vous préférez faire les livraisons..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact d'urgence</h3>

                    <FormField
                      control={form.control}
                      name="emergencyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du contact d'urgence *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom complet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone d'urgence *</FormLabel>
                          <FormControl>
                            <Input placeholder="+22670123456" {...field} />
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
                        <li>• Vérification du permis de conduire</li>
                        <li>• Contrôle de l'état du véhicule</li>
                        <li>• Entretien téléphonique</li>
                        <li>• Formation sur l'application</li>
                        <li>• Activation du compte livreur</li>
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
                      className="ml-auto bg-zaka-orange hover:bg-zaka-orange"
                    >
                      Suivant
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={setupMutation.isPending}
                      className="ml-auto bg-zaka-orange hover:bg-zaka-orange"
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
