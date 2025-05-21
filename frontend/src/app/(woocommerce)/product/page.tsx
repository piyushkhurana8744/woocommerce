"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, Search, X, Image as ImageIcon, Upload, RefreshCw, CloudUpload } from "lucide-react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { 
  useSyncProduct, 
  useCheckWooCommerceProduct, 
  useImportFromWooCommerce 
} from "@/lib/mutation/product/syncproduct"
import axios from "@/lib/axios"
// Add proper imports for the mutation hooks
import useAddProduct from "@/lib/mutation/product/addproduct"
import { useGetProducts } from "@/lib/queries/product/getproduct"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table,TableBody,TableCaption,TableCell,TableHeader,TableRow,TableHead } from "@/components/ui/table"
import { useDeleteProduct, useUpdateProduct } from "@/lib/mutation/product/productMutations"
import CustomModal from "@/components/custommodal"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

// Product schema for form validation
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string()
    .refine(val => val === "" || isValidImageUrl(val), { 
      message: "Please provide a valid image URL (e.g., https://example.com/image.jpg)" 
    })
    .optional(),
});

// Add this helper function to validate URLs safely
function isValidImageUrl(url: string): boolean {
  if (!url) return true;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Product interface updated with WooCommerce fields
interface Product {
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category?: string;
  stock?: number;
  status?: 'CREATED_LOCALLY' | 'SYNCED_TO_WC' | 'SYNC_FAILED';
  wcProductId?: number;
}

type AddProductData = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

// WooCommerce product interface
interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  description: string;
  images: Array<{ src: string }>;
  categories: Array<{ id: number; name: string }>;
  stock_quantity: number;
}

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isWcCheckModalOpen, setIsWcCheckModalOpen] = useState(false)
  const [isWcImportModalOpen, setIsWcImportModalOpen] = useState(false)
  const [productNameToCheck, setProductNameToCheck] = useState("")
  const [wcProductsFound, setWcProductsFound] = useState<WooCommerceProduct[]>([])
  const [Products, setProducts] = useState<Product[]>([])
  const {mutate:addproduct} = useAddProduct()
  
  // Add missing states for operation tracking
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [importingProductId, setImportingProductId] = useState<number | null>(null)
  
  // Add missing states for edit functionality
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Add notification modal states
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationIcon, setNotificationIcon] = useState<"success" | "error" | "warning" | "info">("info")
  const [notificationAction, setNotificationAction] = useState<(() => void) | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  
  // React Query for fetching products
  const { 
    data: products = [], 
    isLoading,
    refetch: refetchProducts
  } = useGetProducts()

  // WooCommerce integration mutations
  const { 
    mutate: syncProduct,
    isPending: isSyncing,
    isSuccess: isSyncSuccess,
    isError: isSyncError,
    error: syncError
  } = useSyncProduct();

  const { 
    mutate: checkWooCommerceProduct,
    isPending: isChecking,
    data: checkResult
  } = useCheckWooCommerceProduct();

  const { 
    mutate: importFromWooCommerce,
    isPending: isImporting,
    isSuccess: isImportSuccess
  } = useImportFromWooCommerce();

  // Edit and delete mutations
  const { 
    mutate: updateProduct,
    isPending: isUpdating 
  } = useUpdateProduct();
  
  const { 
    mutate: deleteProduct,
    isPending: isDeleting 
  } = useDeleteProduct();
  
  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
      imageUrl: "",
    },
  });

  // Setup edit form
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
      imageUrl: "",
    },
  });
  
  // Update wcProductsFound when check results come in
  useEffect(() => {
    if (checkResult && checkResult.products) {
      setWcProductsFound(checkResult.products);
    }
  }, [checkResult]);

  // Helper function to show notification
  const showNotification = (
    title: string, 
    message: string, 
    icon: "success" | "error" | "warning" | "info" = "info", 
    action?: () => void
  ) => {
    setNotificationTitle(title)
    setNotificationMessage(message)
    setNotificationIcon(icon)
    setNotificationAction(action || null)
    setIsNotificationModalOpen(true)
  }

  // Helper function to show confirmation dialog
  const showConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setIsConfirmModalOpen(true)
  }

  // Handle WooCommerce product check
  const handleCheckWooCommerce = () => {
    if (productNameToCheck) {
      checkWooCommerceProduct({ name: productNameToCheck });
    }
  };

  // Handle syncing all local products
  const handleSyncAllProducts = () => {
    // Get all products that need syncing
    const productsToSync = products.filter(p => 
      p.status === 'CREATED_LOCALLY' || p.status === 'SYNC_FAILED'
    );
    
    // Show confirmation if there are products to sync
    if (productsToSync.length === 0) {
      showNotification(
        "Nothing to Sync", 
        "No products need syncing at this time.", 
        "info"
      );
      return;
    }
    
    // Show confirmation modal
    showConfirmation(
      `Sync ${productsToSync.length} products to WooCommerce?`,
      async () => {
        // Close confirmation modal
        setIsConfirmModalOpen(false);
        
        // Show processing notification
        showNotification(
          "Syncing Products",
          `Syncing ${productsToSync.length} products. This might take a moment...`,
          "info"
        );
        
        // Sync each product one by one
        let syncedCount = 0;
        let failedCount = 0;
        let errorMessages: string[] = [];
        
        for (const product of productsToSync) {
          try {
            // Using await with a promise to properly catch errors
            await new Promise<void>((resolve, reject) => {
              syncProduct(product._id, {
                onSuccess: () => {
                  syncedCount++;
                  resolve();
                },
                onError: (error) => {
                  failedCount++;
                  errorMessages.push(`${product.name}: ${error.message || 'Unknown error'}`);
                  resolve(); // We resolve instead of reject to continue the loop
                }
              });
            });
          } catch (error) {
            // Fallback error handling
            failedCount++;
            if (error instanceof Error) {
              errorMessages.push(`${product.name}: ${error.message}`);
            }
          }
        }
        
        setIsNotificationModalOpen(false); // Close the "in progress" notification
        
        // Show final status with more detailed error messages if applicable
        if (failedCount > 0) {
          // Show error notification with details
          showNotification(
            "Sync Incomplete",
            `Successfully synced ${syncedCount} products, but ${failedCount} failed.${
              errorMessages.length > 0 
                ? `\n\nErrors:\n${errorMessages.slice(0, 3).join('\n')}${
                  errorMessages.length > 3 ? `\n...and ${errorMessages.length - 3} more` : ''
                }`
                : ''
            }`,
            "warning",
            () => refetchProducts()
          );
        } else {
          // All successful
          showNotification(
            "Sync Complete",
            `Successfully synced all ${syncedCount} products.`,
            "success",
            () => refetchProducts()
          );
        }
      }
    );
  };
  
  // Improved single product sync with proper error handling
  const handleSyncSingleProduct = (productId: string, productName: string) => {
    setSyncingProductId(productId);
    showNotification(
      "Syncing Product",
      `Syncing "${productName}" with WooCommerce...`,
      "info"
    );
    
    syncProduct(productId, {
      onSuccess: (data) => {
        setSyncingProductId(null);
        setIsNotificationModalOpen(false);
        showNotification(
          "Sync Complete",
          `Successfully synced "${productName}" with WooCommerce.`,
          "success",
          () => refetchProducts()
        );
      },
      onError: (error) => {
        setSyncingProductId(null);
        setIsNotificationModalOpen(false);
        showNotification(
          "Sync Failed",
          `Failed to sync "${productName}": ${error.message || 'Unknown error'}`,
          "error"
        );
      }
    });
  };

  // Handle editing a product
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    
    // Set form values for editing
    editForm.setValue("name", product.name);
    editForm.setValue("price", product.price.toString());
    editForm.setValue("description", product.description);
    editForm.setValue("imageUrl", product.imageUrl || "");
    
    setImagePreview(product.imageUrl);
    setIsEditModalOpen(true);
  };

  // Handle deleting a product
  const handleDeleteProduct = (productId: string, productName: string) => {
    showConfirmation(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      () => {
        setDeletingProductId(productId);
        setIsConfirmModalOpen(false);
        
        showNotification(
          "Deleting Product", 
          `Deleting "${productName}"...`,
          "info"
        );
        
        deleteProduct(productId, {
          onSuccess: () => {
            setDeletingProductId(null);
            setIsNotificationModalOpen(false);
            showNotification(
              "Product Deleted", 
              `Successfully deleted "${productName}".`,
              "success",
              () => refetchProducts()
            );
          },
          onError: (error) => {
            setDeletingProductId(null);
            setIsNotificationModalOpen(false);
            showNotification(
              "Delete Failed", 
              `Failed to delete "${productName}": ${error.message || "Unknown error"}`,
              "error"
            );
          }
        });
      }
    );
  };
  
  // Enhanced import function with modal feedback
  const handleImportWooCommerceProduct = (wcProductId: number) => {
    setImportingProductId(wcProductId);
    showNotification(
      "Importing Product",
      "Starting import from WooCommerce...",
      "info"
    );
    
    importFromWooCommerce(wcProductId, {
      onSuccess: () => {
        setImportingProductId(null);
        setIsNotificationModalOpen(false);
        setIsWcCheckModalOpen(false);
        refetchProducts();
        
        // Show success message
        showNotification(
          "Import Complete",
          "Product successfully imported from WooCommerce!",
          "success"
        );
      },
      onError: (error) => {
        setImportingProductId(null);
        setIsNotificationModalOpen(false);
        showNotification(
          "Import Failed",
          `Failed to import product: ${error.message || 'Unknown error'}`,
          "error"
        );
      }
    });
  };

  // Form submission handler
  function onSubmit(values: ProductFormValues) {
    const newProduct: AddProductData = {
      name: values.name,
      price: parseFloat(values.price),
      description: values.description,
      imageUrl: imagePreview || values.imageUrl || "https://placehold.co/400x300",
    };
    addproduct(newProduct)

    setProducts((prev) => [newProduct, ...prev]);
    setIsModalOpen(false);
    setImagePreview(null);
    setSelectedImage(null);
    form.reset();
  }
  
  // Edit form submission handler
  function onEditSubmit(values: ProductFormValues) {
    if (!editingProduct) return;
    
    const updatedProduct = {
      _id: editingProduct._id,
      name: values.name,
      price: parseFloat(values.price),
      description: values.description,
      imageUrl: imagePreview || values.imageUrl,
    };
    
    showNotification(
      "Updating Product",
      `Updating "${values.name}"...`,
      "info"
    );
    
    updateProduct(updatedProduct, {
      onSuccess: () => {
        setIsNotificationModalOpen(false);
        showNotification(
          "Update Complete",
          `Successfully updated "${values.name}".`,
          "success",
          () => refetchProducts()
        );
        setIsEditModalOpen(false);
      },
      onError: (error) => {
        setIsNotificationModalOpen(false);
        showNotification(
          "Update Failed",
          `Failed to update "${values.name}": ${error.message || "Unknown error"}`,
          "error"
        );
      }
    });
  }
  
  // Show full image preview
  const handleShowFullImage = (imageUrl: string) => {
    setPreviewImage(imageUrl)
    setIsPreviewModalOpen(true)
  }
  
  // Filter products based on search query
  const filteredProducts = products.filter((product:any) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-gray-500 mt-1">Manage your store's products</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button variant="outline" onClick={() => setIsWcCheckModalOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Check WooCommerce
          </Button>
          <Button 
            onClick={handleSyncAllProducts}
            variant="secondary"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-500">Synced with WooCommerce</p>
              <p className="text-2xl font-bold">
                {products.filter(p => p.status === 'SYNCED_TO_WC').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-500">Need Sync</p>
              <p className="text-2xl font-bold">
                {products.filter(p => p.status === 'CREATED_LOCALLY' || p.status === 'SYNC_FAILED').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableCaption>
            {isLoading ? 'Loading products...' : 
              filteredProducts.length === 0 ? 'No products found' : 
              `Showing ${filteredProducts.length} of ${products.length} products`
            }
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <div 
                        className="relative w-12 h-12 rounded cursor-pointer overflow-hidden"
                        onClick={() => handleShowFullImage(product.imageUrl!)}
                      >
                        <Image 
                          src={product.imageUrl} 
                          alt={product.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {product.name}
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {product.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        product.status === 'SYNCED_TO_WC' ? "default" :
                        product.status === 'SYNC_FAILED' ? "destructive" : "outline"
                      }
                    >
                      {product.status === 'SYNCED_TO_WC' ? 'Synced' :
                        product.status === 'SYNC_FAILED' ? 'Sync Failed' : 'Local Only'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSyncSingleProduct(product._id, product.name)}
                        disabled={isSyncing}
                      >
                        {isSyncing && product._id === syncingProductId ? (
                          <span className="animate-spin mr-1">⏳</span>
                        ) : (
                          <RefreshCw className="mr-1 h-3 w-3" />
                        )}
                        {isSyncing && product._id === syncingProductId ? 'Syncing' : 'Sync'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product._id, product.name)}
                        disabled={isDeleting && deletingProductId === product._id}
                      >
                        {isDeleting && deletingProductId === product._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Check WooCommerce Products Modal */}
      <CustomModal
        isOpen={isWcCheckModalOpen}
        onClose={() => setIsWcCheckModalOpen(false)}
        title="Check WooCommerce Products"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsWcCheckModalOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter product name..."
              value={productNameToCheck}
              onChange={(e) => setProductNameToCheck(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && productNameToCheck) {
                  handleCheckWooCommerce();
                }
              }}
            />
            <Button 
              onClick={handleCheckWooCommerce} 
              disabled={isChecking || !productNameToCheck}
            >
              {isChecking ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Checking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {checkResult && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">
                {checkResult.products.length} products found in WooCommerce
              </h3>
              {checkResult.products.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No matching products found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {checkResult.products.map((product) => (
                    <div key={product.id} className="border rounded p-4 flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
                            <Image 
                              src={product.images[0].src} 
                              alt={product.name} 
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">${product.price}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {product.categories?.map(cat => (
                              <Badge key={cat.id} variant="outline" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleImportWooCommerceProduct(product.id)}
                        disabled={isImporting && importingProductId === product.id}
                      >
                        {isImporting && importingProductId === product.id ? (
                          <>Importing...</>
                        ) : (
                          <>
                            <CloudUpload className="mr-2 h-4 w-4" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CustomModal>

      {/* Add Product Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Product"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the product..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      onChange={e => {
                        field.onChange(e);
                        
                        // Only set the preview if it's a valid URL
                        if (isValidImageUrl(e.target.value)) {
                          setImagePreview(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {form.watch("imageUrl") && isValidImageUrl(form.watch("imageUrl")) && (
                    <div className="mt-2 flex justify-center">
                      <div className="relative w-40 h-40 border rounded">
                        <Image
                          src={form.watch("imageUrl")}
                          alt="Product preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Add sync option checkbox */}
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="syncToWooCommerce"
                className="h-4 w-4"
                defaultChecked={true}
              />
              <label htmlFor="syncToWooCommerce" className="text-sm font-medium">
                Sync to WooCommerce after creation
              </label>
            </div>
          </form>
        </Form>
      </CustomModal>
      
      {/* Edit Product Modal */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={editForm.handleSubmit(onEditSubmit)}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Product"}
            </Button>
          </div>
        }
      >
        <Form {...editForm}>
          <form className="space-y-4">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the product..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      onChange={e => {
                        field.onChange(e);
                        
                        // Only set the preview if it's a valid URL
                        if (isValidImageUrl(e.target.value)) {
                          setImagePreview(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {(imagePreview || editForm.watch("imageUrl")) && 
                   isValidImageUrl(imagePreview || editForm.watch("imageUrl")) && (
                    <div className="mt-2 flex justify-center">
                      <div className="relative w-40 h-40 border rounded">
                        <Image
                          src={imagePreview || editForm.watch("imageUrl")}
                          alt="Product preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {editingProduct?.wcProductId && (
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="syncProductChanges"
                  className="h-4 w-4"
                  defaultChecked={true}
                />
                <label htmlFor="syncProductChanges" className="text-sm font-medium">
                  Sync changes to WooCommerce
                </label>
                <Badge className="ml-2">WooCommerce ID: {editingProduct.wcProductId}</Badge>
              </div>
            )}
          </form>
        </Form>
      </CustomModal>
      
      {/* Image Preview Modal */}
      <CustomModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        size="xl"
        showCloseButton={true}
      >
        <div className="relative w-full h-[60vh] max-h-[600px]">
          {previewImage && (
            <Image
              src={previewImage}
              alt="Product image preview"
              fill
              className="object-contain"
            />
          )}
        </div>
      </CustomModal>

      {/* Notification Modal */}
      <CustomModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        title={notificationTitle}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNotificationModalOpen(false)}>
              Close
            </Button>
            {notificationAction && (
              <Button onClick={() => {
                notificationAction();
                setIsNotificationModalOpen(false);
              }}>
                Continue
              </Button>
            )}
          </div>
        }
      >
        <div className="flex items-start gap-4 p-2">
          <div className="flex-shrink-0 p-2">
            {notificationIcon === "success" && (
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {notificationIcon === "error" && (
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {notificationIcon === "warning" && (
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            {notificationIcon === "info" && (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-gray-600">{notificationMessage}</p>
          </div>
        </div>
      </CustomModal>

      {/* Confirmation Modal */}
      <CustomModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Action"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => confirmAction && confirmAction()}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-4 p-2">
          <div className="flex-shrink-0 p-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-600">{confirmMessage}</p>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}