import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, FileText, X, ZoomIn, ZoomOut, Check, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DocumentViewerProps {
  documentUrl?: string;
  documentName: string;
  documentType: "identity" | "business_license" | "other";
  vendorName?: string;
  vendorId?: string;
  documentStatus?: "pending" | "verified" | "rejected";
  reviewNotes?: string;
  isAdmin?: boolean;
  className?: string;
  trigger?: React.ReactNode;
  onStatusUpdate?: () => void;
}

export default function DocumentViewer({
  documentUrl,
  documentName,
  documentType,
  vendorName,
  vendorId,
  documentStatus = "pending",
  reviewNotes,
  isAdmin = false,
  className = "",
  trigger,
  onStatusUpdate,
}: DocumentViewerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState(reviewNotes || "");
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  // Document verification mutation
  const verifyDocumentMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: "verified" | "rejected"; notes: string }) => {
      if (!vendorId) throw new Error("Vendor ID required");
      return await apiRequest("PATCH", `/api/admin/vendors/${vendorId}/verify-document`, {
        documentType: documentType === "identity" ? "identity" : "business_license",
        status,
        notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Document vérifié",
        description: "Le statut du document a été mis à jour avec succès",
      });
      setIsOpen(false);
      setShowVerificationForm(false);
      onStatusUpdate?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut du document",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    switch (documentStatus) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Vérifié</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  const handleVerifyDocument = (status: "verified" | "rejected") => {
    verifyDocumentMutation.mutate({ status, notes: verificationNotes });
  };

  if (!documentUrl) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <FileText className="h-4 w-4 mr-1" />
        Aucun document
      </Button>
    );
  }

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case "identity":
        return "Pièce d'identité";
      case "business_license":
        return "Registre de commerce";
      default:
        return "Document";
    }
  };

  const getDocumentTypeIcon = () => {
    switch (documentType) {
      case "identity":
        return "fas fa-id-card";
      case "business_license":
        return "fas fa-certificate";
      default:
        return "fas fa-file-alt";
    }
  };

  const getDocumentTypeBadge = () => {
    switch (documentType) {
      case "identity":
        return "bg-blue-100 text-blue-800";
      case "business_license":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${vendorName || "document"}_${documentName}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Téléchargement réussi",
        description: "Le document a été téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  };

  const isPDF = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const zoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setImageScale(1);
  };

  const DefaultTrigger = () => (
    <Button variant="outline" size="sm" className={className}>
      <Eye className="h-4 w-4 mr-1" />
      Voir
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || <DefaultTrigger />}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <i className={`${getDocumentTypeIcon()} text-lg`}></i>
                {getDocumentTypeLabel()}
                {vendorName && <span className="text-base font-normal">- {vendorName}</span>}
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getDocumentTypeBadge()}>{getDocumentTypeLabel()}</Badge>
                  {getStatusBadge()}
                  <span className="text-sm text-gray-500">{documentName}</span>
                </div>
                {reviewNotes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Notes de révision:</strong> {reviewNotes}
                  </div>
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {isImage(documentUrl) && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={zoomOut} disabled={imageScale <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2">{Math.round(imageScale * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={zoomIn} disabled={imageScale >= 3}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetZoom}>
                    Reset
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isImage(documentUrl) ? (
            <div className="flex justify-center p-4">
              <div className="relative inline-block">
                {isLoading && (
                  <div className="flex items-center justify-center w-96 h-96 bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zaka-orange"></div>
                  </div>
                )}
                {hasError ? (
                  <div className="flex flex-col items-center justify-center w-96 h-96 bg-gray-100 rounded-lg text-gray-500">
                    <i className="fas fa-exclamation-circle text-4xl mb-2"></i>
                    <p>Impossible de charger l'image</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(documentUrl, "_blank")}
                    >
                      Ouvrir dans un nouvel onglet
                    </Button>
                  </div>
                ) : (
                  <img
                    src={documentUrl}
                    alt={documentName}
                    className="max-w-none rounded-lg shadow-lg"
                    style={{
                      transform: `scale(${imageScale})`,
                      transformOrigin: "center",
                      transition: "transform 0.2s ease",
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
              </div>
            </div>
          ) : isPDF(documentUrl) ? (
            <div className="w-full h-96">
              <iframe
                src={documentUrl}
                className="w-full h-full border-0 rounded-lg"
                title={documentName}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <i className="fas fa-file text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aperçu non disponible</h3>
              <p className="text-gray-500 mb-4">
                Ce type de fichier ne peut pas être affiché dans le navigateur.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open(documentUrl, "_blank")}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t pt-4 space-y-4">
          {/* Admin Verification Controls */}
          {isAdmin && vendorId && documentStatus !== "verified" && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Vérification du document</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVerificationForm(!showVerificationForm)}
                >
                  {showVerificationForm ? "Masquer" : "Vérifier"}
                </Button>
              </div>

              {showVerificationForm && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="verification-notes">Notes de vérification</Label>
                    <Textarea
                      id="verification-notes"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Ajoutez vos notes de vérification..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerifyDocument("verified")}
                      disabled={verifyDocumentMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {verifyDocumentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approuver
                    </Button>
                    <Button
                      onClick={() => handleVerifyDocument("rejected")}
                      disabled={verifyDocumentMutation.isPending}
                      variant="destructive"
                    >
                      {verifyDocumentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      )}
                      Rejeter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">Document:</span> {documentName}
              </span>
              <span>
                <span className="font-medium">Statut:</span> {getStatusBadge()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Télécharger
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
