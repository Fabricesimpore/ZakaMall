import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Category, Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ProductImageUploaderForm from "@/components/ProductImageUploaderForm";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const productFormSchema = z.object({
  name: z.string().min(1, "Le nom du produit est requis"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  price: z.string().refine(
    (val) => {
      const price = Number(val);
      // Price must be between 100 CFA and 10,000,000 CFA
      return !isNaN(price) && price >= 100 && price <= 10000000;
    },
    {
      message: "Le prix doit être entre 100 CFA et 10,000,000 CFA",
    }
  ),
  compareAtPrice: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const price = Number(val);
        return !isNaN(price) && price >= 100 && price <= 10000000;
      },
      {
        message: "Le prix comparé doit être entre 100 CFA et 10,000,000 CFA",
      }
    ),
  sku: z.string().optional(),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "La quantité doit être un nombre positif",
  }),
  weight: z.string().optional(),
  images: z.array(z.string()).min(1, "Au moins une image est requise"),
  videos: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  trackQuantity: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const [, setLocation] = useLocation();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!productId;

  const { data: categories = [] as Category[] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: product = {} as Product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/vendor/products", productId],
    enabled: isEdit,
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      price: "",
      compareAtPrice: "",
      sku: "",
      quantity: "0",
      weight: "",
      images: [],
      videos: [],
      isActive: true,
      isFeatured: false,
      trackQuantity: true,
    },
  });

  useEffect(() => {
    if (product && isEdit) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        price: product.price?.toString() || "",
        compareAtPrice: product.compareAtPrice?.toString() || "",
        sku: product.sku || "",
        quantity: product.quantity?.toString() || "0",
        weight: product.weight?.toString() || "",
        images: product.images || [],
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        trackQuantity: product.trackQuantity ?? true,
      });
      setImageUrls(product.images || []);
      setVideoUrls(product.videos || []);
    }
  }, [product, isEdit, form]);

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      console.log("🛍️ Creating product with data:", data);
      const productData = {
        ...data,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
        quantity: Number(data.quantity),
        weight: data.weight ? Number(data.weight) : null,
      };
      console.log("📦 Processed product data:", productData);

      if (isEdit) {
        console.log("✏️ Updating existing product:", productId);
        return await apiRequest("PUT", `/api/vendor/products/${productId}`, productData);
      } else {
        console.log("🆕 Creating new product");
        const result = await apiRequest("POST", "/api/vendor/products", productData);
        console.log("✅ Product creation result:", result);
        return result;
      }
    },
    onSuccess: (result) => {
      console.log("🎉 Product save successful, result:", result);
      console.log("🔄 Invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/stats"] });
      console.log("✅ Queries invalidated, showing toast and redirecting");
      toast({
        title: isEdit ? "Produit mis à jour" : "Produit créé",
        description: isEdit
          ? "Le produit a été mis à jour avec succès"
          : "Le produit a été créé avec succès",
      });
      setLocation("/vendor/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (imageUrls.length === 0) {
      toast({
        title: "Erreur",
        description: "Au moins une image est requise",
        variant: "destructive",
      });
      return;
    }

    saveProductMutation.mutate({
      ...data,
      images: imageUrls,
      videos: videoUrls,
    });
  };

  if (productLoading && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zaka-dark">
            {isEdit ? "Modifier le produit" : "Ajouter un nouveau produit"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? "Modifiez les informations de votre produit"
              : "Remplissez les informations pour ajouter un nouveau produit"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre produit en détail..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU (optionnel)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prix et inventaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix de vente (CFA) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compareAtPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix de comparaison (CFA)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité en stock *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poids (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images du produit</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductImageUploaderForm
                  onImagesChange={(images) => {
                    setImageUrls(images);
                    form.setValue("images", images);
                  }}
                  currentImages={imageUrls}
                />
              </CardContent>
            </Card>

            {/* Video Upload Section - Only show for restaurant category */}
            {form.watch("categoryId") === "restaurant" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-video text-zaka-orange"></i>
                    Vidéos du produit (Restaurant)
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Ajoutez des vidéos de vos plats pour le feed TikTok-style
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videoUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1">
                          <video 
                            src={url} 
                            className="w-full h-32 object-cover rounded"
                            controls
                          />
                          <p className="text-xs text-gray-500 mt-1 truncate">{url}</p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newVideos = videoUrls.filter((_, i) => i !== index);
                            setVideoUrls(newVideos);
                            form.setValue("videos", newVideos);
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </Button>
                      </div>
                    ))}
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="url"
                        placeholder="URL de la vidéo (YouTube, Vimeo, fichier direct...)"
                        className="w-full p-2 border rounded"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const url = input.value.trim();
                            if (url) {
                              const newVideos = [...videoUrls, url];
                              setVideoUrls(newVideos);
                              form.setValue("videos", newVideos);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Appuyez sur Entrée pour ajouter la vidéo
                      </p>
                      <div className="mt-3 text-xs text-gray-400">
                        <p>💡 Conseils pour les vidéos :</p>
                        <ul className="mt-1 space-y-1 text-left max-w-md mx-auto">
                          <li>• Courtes et engageantes (15-60 secondes)</li>
                          <li>• Montrent le plat en préparation ou fini</li>
                          <li>• Bonne qualité vidéo et audio</li>
                          <li>• Orientées verticalement pour mobile</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Produit actif</FormLabel>
                          <p className="text-sm text-gray-600">
                            Les produits actifs sont visibles dans la boutique
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Produit en vedette</FormLabel>
                          <p className="text-sm text-gray-600">
                            Les produits en vedette apparaissent en première page
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trackQuantity"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Suivre l'inventaire</FormLabel>
                          <p className="text-sm text-gray-600">
                            Décompter automatiquement le stock lors des ventes
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/vendor/dashboard")}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saveProductMutation.isPending}
                className="bg-zaka-orange hover:bg-zaka-orange"
              >
                {saveProductMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isEdit ? "Mise à jour..." : "Création..."}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    {isEdit ? "Mettre à jour" : "Créer le produit"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
