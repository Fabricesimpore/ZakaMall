import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zaka-dark mb-4">Contactez-Nous</h1>
          <p className="text-xl text-zaka-gray max-w-3xl mx-auto">
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter pour toute question,
            suggestion ou demande de support.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zaka-dark">
                <i className="fas fa-envelope text-zaka-orange mr-3"></i>
                Envoyez-nous un Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zaka-dark mb-2">
                      Nom complet *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-zaka-dark mb-2"
                    >
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-zaka-dark mb-2"
                  >
                    Sujet *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Sujet de votre message"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-zaka-dark mb-2"
                  >
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Décrivez votre demande en détail..."
                    rows={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-zaka-orange hover:bg-zaka-orange/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Envoyer le Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-zaka-dark">
                  <i className="fas fa-map-marker-alt text-zaka-orange mr-3"></i>
                  Nos Coordonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-map-marker-alt text-zaka-orange"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-zaka-dark">Adresse</h3>
                    <p className="text-zaka-gray">
                      Secteur 15, Avenue Kwame Nkrumah
                      <br />
                      Ouagadougou, Burkina Faso
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-zaka-blue bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-phone text-zaka-blue"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-zaka-dark">Téléphone</h3>
                    <p className="text-zaka-gray">
                      +226 25 XX XX XX
                      <br />
                      +226 70 XX XX XX (WhatsApp)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-zaka-green bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-envelope text-zaka-green"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-zaka-dark">Email</h3>
                    <p className="text-zaka-gray">
                      support@zakamall.com
                      <br />
                      contact@zakamall.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-clock text-zaka-orange"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-zaka-dark">Horaires</h3>
                    <p className="text-zaka-gray">
                      Lundi - Vendredi : 8h00 - 18h00
                      <br />
                      Samedi : 9h00 - 16h00
                      <br />
                      Dimanche : Fermé
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zaka-dark">
                  <i className="fas fa-headset text-zaka-orange mr-3"></i>
                  Types de Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-shopping-cart text-zaka-blue w-5"></i>
                    <span className="text-zaka-gray">Problèmes de commande</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-credit-card text-zaka-blue w-5"></i>
                    <span className="text-zaka-gray">Questions de paiement</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-truck text-zaka-blue w-5"></i>
                    <span className="text-zaka-gray">Suivi de livraison</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-store text-zaka-blue w-5"></i>
                    <span className="text-zaka-gray">Support vendeur</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-cog text-zaka-blue w-5"></i>
                    <span className="text-zaka-gray">Problèmes techniques</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-shield-alt text-zaka-blue w-5"></i>
                    <span className="text-zaka-gray">Sécurité et compte</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zaka-dark">
                  <i className="fas fa-share-alt text-zaka-orange mr-3"></i>
                  Suivez-nous
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zaka-gray mb-4">
                  Restez connectés pour les dernières nouvelles et mises à jour.
                </p>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    aria-label="Facebook"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                    aria-label="Twitter"
                  >
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                    aria-label="Instagram"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <i className="fab fa-whatsapp"></i>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              <i className="fas fa-question-circle text-zaka-orange mr-3"></i>
              Questions Fréquentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-zaka-dark mb-2">Comment passer une commande ?</h3>
                <p className="text-zaka-gray text-sm mb-4">
                  Inscrivez-vous, parcourez les produits, ajoutez au panier et procédez au paiement
                  sécurisé.
                </p>

                <h3 className="font-semibold text-zaka-dark mb-2">
                  Quels sont les frais de livraison ?
                </h3>
                <p className="text-zaka-gray text-sm mb-4">
                  Les frais varient selon la zone de livraison. Généralement 500-2000 FCFA dans
                  Ouagadougou.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-zaka-dark mb-2">Comment devenir vendeur ?</h3>
                <p className="text-zaka-gray text-sm mb-4">
                  Créez un compte vendeur, soumettez vos documents et attendez la validation de
                  notre équipe.
                </p>

                <h3 className="font-semibold text-zaka-dark mb-2">
                  Que faire en cas de problème ?
                </h3>
                <p className="text-zaka-gray text-sm mb-4">
                  Contactez notre support via ce formulaire ou par téléphone pour une assistance
                  rapide.
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <a href="/help" className="text-zaka-orange hover:underline font-medium">
                <i className="fas fa-arrow-right mr-2"></i>
                Voir toutes les FAQ
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
