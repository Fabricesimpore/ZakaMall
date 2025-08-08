import { useState } from "react";
import { Button } from "@/components/ui/button";
import PhoneSignup from "@/components/PhoneSignup";
import EmailSignup from "@/components/EmailSignup";

interface SignupModalProps {
  onSuccess: () => void;
}

export default function SignupModal({ onSuccess }: SignupModalProps) {
  const [signupType, setSignupType] = useState<'choice' | 'phone' | 'email'>('choice');

  if (signupType === 'phone') {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSignupType('choice')}
            className="text-zaka-orange hover:text-zaka-orange mr-3"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h3 className="text-lg font-semibold">Inscription par téléphone</h3>
        </div>
        <PhoneSignup onSuccess={onSuccess} />
      </div>
    );
  }

  if (signupType === 'email') {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSignupType('choice')}
            className="text-zaka-orange hover:text-zaka-orange mr-3"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h3 className="text-lg font-semibold">Inscription par email</h3>
        </div>
        <EmailSignup onSuccess={onSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-zaka-dark mb-2">Comment souhaitez-vous vous inscrire ?</h3>
        <p className="text-gray-600">Choisissez votre méthode d'inscription préférée</p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => setSignupType('phone')}
          className="w-full bg-white border border-gray-200 text-zaka-dark hover:bg-gray-50 h-auto p-6"
          variant="outline"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-zaka-orange bg-opacity-10 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-mobile-alt text-xl text-zaka-orange"></i>
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-1">Numéro de téléphone</h4>
                <p className="text-sm text-gray-600">Vérification par SMS (recommandé)</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </div>
        </Button>

        <Button
          onClick={() => setSignupType('email')}
          className="w-full bg-white border border-gray-200 text-zaka-dark hover:bg-gray-50 h-auto p-6"
          variant="outline"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-envelope text-xl text-blue-500"></i>
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-1">Adresse email</h4>
                <p className="text-sm text-gray-600">Vérification par email</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </div>
        </Button>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <i className="fas fa-shield-alt text-zaka-green"></i>
          <span>Vos données sont protégées et sécurisées</span>
        </div>
      </div>
    </div>
  );
}