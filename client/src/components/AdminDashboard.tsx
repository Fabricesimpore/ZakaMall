import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor, AdminStats, TransactionData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminAnalytics from "@/components/AdminAnalytics";

export default function AdminDashboard() {
  const [, setSelectedVendor] = useState<Vendor | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [transactionFilters, setTransactionFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
  });

  const typedStats = (stats || {}) as AdminStats;

  const { data: pendingVendors = [] as Vendor[], isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/admin/vendors/pending"],
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/admin/transactions", transactionFilters],
  });

  const typedTransactions = (transactionsData || { transactions: [], total: 0 }) as TransactionData;

  const approveVendorMutation = useMutation({
    mutationFn: async ({
      vendorId,
      status,
      notes,
    }: {
      vendorId: string;
      status: string;
      notes?: string;
    }) => {
      return await apiRequest("PATCH", `/api/admin/vendors/${vendorId}/approve`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setSelectedVendor(null);
      setApprovalNotes("");
      toast({
        title: "Vendeur mis à jour",
        description: "Le statut du vendeur a été mis à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVendorApproval = (vendor: any, status: "approved" | "rejected") => {
    setSelectedVendor(vendor);
    approveVendorMutation.mutate({
      vendorId: vendor.id,
      status,
      notes: approvalNotes,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zaka-dark">Tableau de bord administrateur</h1>
            <p className="text-gray-600 mt-2">Gérez la plateforme et surveillez l'activité</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-store text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendeurs actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (typedStats.activeVendors || 0).toString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-shopping-cart text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commandes du jour</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (typedStats.dailyOrders || 0).toString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-dollar-sign text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenus plateforme</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading
                      ? "..."
                      : `${(typedStats.platformRevenue || 0).toLocaleString()} CFA`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-truck text-orange-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chauffeurs disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (typedStats.availableDrivers || 0).toString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendors">
              Approbation vendeurs ({(pendingVendors as unknown[])?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Vendeurs en attente d'approbation</CardTitle>
              </CardHeader>
              <CardContent>
                {vendorsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (pendingVendors as unknown[])?.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Aucun vendeur en attente
                    </h3>
                    <p className="text-gray-500">Toutes les demandes ont été traitées</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(pendingVendors as Record<string, unknown>[]).map(
                      (vendor: Record<string, unknown>) => (
                        <div key={vendor.id as string} className="border rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">
                                {vendor.businessName as string}
                              </h3>
                              <p className="text-gray-600">{vendor.businessType as string}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Demandé le{" "}
                                {new Date(vendor.createdAt as string).toLocaleDateString("fr-BF")}
                              </p>

                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Adresse:</p>
                                  <p className="text-sm text-gray-600">
                                    {vendor.businessAddress as string}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Téléphone:</p>
                                  <p className="text-sm text-gray-600">{vendor.phone as string}</p>
                                </div>
                                {(vendor.taxId as string) && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">ID fiscal:</p>
                                    <p className="text-sm text-gray-600">
                                      {vendor.taxId as string}
                                    </p>
                                  </div>
                                )}
                                {(vendor.description as string) && (
                                  <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-700">
                                      Description:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {vendor.description as string}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2 ml-6">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setSelectedVendor(vendor as any)}
                                  >
                                    <i className="fas fa-check mr-2"></i>
                                    Approuver
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Approuver le vendeur</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir approuver "
                                      {vendor.businessName as string}" ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <Textarea
                                      placeholder="Notes d'approbation (optionnel)"
                                      value={approvalNotes}
                                      onChange={(e) => setApprovalNotes(e.target.value)}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleVendorApproval(vendor, "approved")}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Approuver
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => setSelectedVendor(vendor as any)}
                                  >
                                    <i className="fas fa-times mr-2"></i>
                                    Rejeter
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Rejeter le vendeur</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir rejeter "
                                      {vendor.businessName as string}" ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <Textarea
                                      placeholder="Raison du rejet (requis)"
                                      value={approvalNotes}
                                      onChange={(e) => setApprovalNotes(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleVendorApproval(vendor, "rejected")}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={!approvalNotes.trim()}
                                    >
                                      Rejeter
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Suivi des transactions</span>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={transactionFilters.status}
                      onValueChange={(value) =>
                        setTransactionFilters((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="completed">Terminées</SelectItem>
                        <SelectItem value="failed">Échouées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {typedTransactions.transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {transaction.transactionId || transaction.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {transaction.createdAt
                                ? new Date(transaction.createdAt).toLocaleDateString("fr-BF", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Date inconnue"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Méthode: {transaction.paymentMethod.replace("_", " ").toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {parseInt(transaction.amount).toLocaleString("fr-BF")} CFA
                            </p>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : transaction.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {transaction.status === "completed"
                                ? "Terminée"
                                : transaction.status === "pending"
                                  ? "En attente"
                                  : "Échouée"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}

                    {typedTransactions.transactions.length === 0 && (
                      <div className="text-center py-8">
                        <i className="fas fa-receipt text-6xl text-gray-300 mb-4"></i>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          Aucune transaction trouvée
                        </h3>
                        <p className="text-gray-500">
                          Aucune transaction ne correspond aux filtres sélectionnés
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
