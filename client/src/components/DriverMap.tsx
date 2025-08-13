import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Clock, Route } from "lucide-react";

interface DeliveryLocation {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  customerName: string;
  phone: string;
  estimatedTime: number; // minutes
  distance: number; // km
}

interface DriverMapProps {
  delivery?: DeliveryLocation;
  onNavigate?: () => void;
  onCallCustomer?: () => void;
}

export default function DriverMap({ delivery, onNavigate, onCallCustomer }: DriverMapProps) {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Request geolocation permission and track driver location
    const startTracking = () => {
      if ("geolocation" in navigator) {
        setIsTracking(true);
        
        // Get current position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("Error getting location:", error);
            setIsTracking(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );

        // Watch position changes
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("Error tracking location:", error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
      }
    };

    const cleanup = startTracking();
    return cleanup;
  }, []);

  const handleOpenMaps = () => {
    if (delivery && delivery.address) {
      // Try to open in Google Maps app, fallback to web
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.address)}&travelmode=driving`;
      window.open(mapsUrl, '_blank');
      onNavigate?.();
    }
  };

  const handleCallCustomer = () => {
    if (delivery && delivery.phone) {
      window.open(`tel:${delivery.phone}`);
      onCallCustomer?.();
    }
  };

  if (!delivery) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Aucune livraison active
          </h3>
          <p className="text-gray-500">
            Acceptez une livraison pour voir l'itinéraire
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Map Display Area */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 h-64 rounded-t-lg overflow-hidden">
          {/* Route Visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 300 200"
              className="absolute inset-0"
            >
              {/* Route Path */}
              <path
                d="M 50 150 Q 150 50 250 100"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeDasharray="8,4"
                fill="none"
                className="animate-pulse"
              />
              
              {/* Start Point (Driver) */}
              <circle
                cx="50"
                cy="150"
                r="8"
                fill="#10B981"
                className="animate-pulse"
              />
              <text x="30" y="170" fontSize="12" fill="#374151" fontWeight="bold">
                Vous
              </text>
              
              {/* End Point (Destination) */}
              <circle
                cx="250"
                cy="100"
                r="8"
                fill="#EF4444"
              />
              <text x="220" y="85" fontSize="12" fill="#374151" fontWeight="bold">
                Destination
              </text>
            </svg>
          </div>

          {/* Location Status */}
          <div className="absolute top-4 left-4">
            <Badge 
              variant={isTracking ? "default" : "secondary"}
              className={isTracking ? "bg-green-500" : ""}
            >
              <Navigation size={12} className="mr-1" />
              {isTracking ? "Position active" : "Position inactive"}
            </Badge>
          </div>

          {/* Real-time Info */}
          {currentLocation && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
              <p className="text-gray-600">
                Lat: {currentLocation.latitude.toFixed(6)}
              </p>
              <p className="text-gray-600">
                Lng: {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Destination de livraison</h3>
            <div className="flex items-start space-x-3">
              <MapPin className="text-red-500 mt-1" size={16} />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{delivery.address}</p>
                <p className="text-xs text-gray-600">Client: {delivery.customerName}</p>
              </div>
            </div>
          </div>

          {/* Trip Statistics */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Clock className="text-blue-500" size={16} />
              <div>
                <p className="text-xs text-gray-600">Temps estimé</p>
                <p className="text-sm font-semibold">{delivery.estimatedTime} min</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Route className="text-green-500" size={16} />
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="text-sm font-semibold">{delivery.distance.toFixed(1)} km</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleOpenMaps}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="mr-2" size={16} />
              Ouvrir GPS
            </Button>
            <Button
              onClick={handleCallCustomer}
              variant="outline"
              className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
            >
              <i className="fas fa-phone mr-2"></i>
              Appeler
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <i className="fas fa-info-circle mr-1"></i>
              Cliquez sur "Ouvrir GPS" pour lancer la navigation dans votre application de cartes préférée.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}