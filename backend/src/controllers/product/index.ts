import { Request, Response } from "express";
import Product from "../../model/product";
import { Types } from "mongoose"; // Import Types from mongoose
import { AuthRequest } from "../../types";
import { createWcApiClient } from "../../utils/woocommerce";
import integration from "../../model/integration";

// Helper function to get WooCommerce credentials for a user
async function getWooCommerceCredentials(userId: string) {
  console.log(userId,"userID")
  const newintegration = await integration.findOne({ userId, integration: 'WooCommerce' });
  
  if (!newintegration) {
    throw new Error('WooCommerce integration not found for this user please integrate first');
  }
  
  return {
    url: newintegration.storeUrl,
    consumerKey: newintegration.key,
    consumerSecret: newintegration?.secret
  };
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}

// Helper function to validate image URLs
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Check for common image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowercaseUrl = url.toLowerCase();
  
  return validExtensions.some(ext => lowercaseUrl.endsWith(ext));
}

// Helper function to prepare product data for WooCommerce
function prepareWooCommerceProductData(product: any) {
  const wcProductData: any = {
    name: product.name,
    description: product.description,
    regular_price: product.price.toString(),
  };
  
  // Only include images if they have valid extensions
  if (product.imageUrl && isValidImageUrl(product.imageUrl)) {
    wcProductData.images = [{ src: product.imageUrl }];
  }
  
  return wcProductData;
}

// Get all products
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find({ userId: req.user?._id }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err });
  }
};

// Check if a product exists in WooCommerce by name or SKU
export const checkWooCommerceProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Get user's WooCommerce credentials
      const credentials = await getWooCommerceCredentials(userId);
      const wcClient = createWcApiClient(credentials);
      
      // Search for products in WooCommerce
      let searchParams = {};
      if (name) searchParams = { search: name };
      if (sku) searchParams = { ...searchParams, sku };
      
      const wcProducts = await wcClient.getProducts(searchParams);
      
      if (wcProducts && wcProducts.length > 0) {
        return res.status(200).json({
          exists: true,
          products: wcProducts,
          message: "Products found in WooCommerce"
        });
      } else {
        return res.status(200).json({
          exists: false,
          products: [],
          message: "No matching products found in WooCommerce"
        });
      }
    } catch (err: unknown) {
    const errorMessage = isErrorWithMessage(err) ? err.message : "Unknown error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
  } catch (err: unknown) {
    const errorMessage = isErrorWithMessage(err) ? err.message : "Unknown error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

// Add a new product
export const addProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, imageUrl, syncToWooCommerce = true } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Create product in local database first
    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      userId, // Ensure userId is always added to the product
      status: "CREATED_LOCALLY"
    });
    
    await product.save();
    
    // Try to sync with WooCommerce if requested and user has integration
    if (syncToWooCommerce) {
      try {
        const credentials = await getWooCommerceCredentials(userId);
        const wcClient = createWcApiClient(credentials);
        
        // Prepare data with validated image
        const wcProductData = prepareWooCommerceProductData({
          name, description, price, imageUrl
        });
        
        try {
          const wcProduct = await wcClient.createProduct(wcProductData);
          
          // Update local product with WC ID and status
          product.wcProductId = wcProduct.id;
          product.status = "SYNCED_TO_WC";
          await product.save();
          
          return res.status(201).json({
            message: "Product created and synced with WooCommerce",
            product
          });
        } catch (syncError: any) {
          // Handle image upload error specifically
          if (syncError.response?.data?.code === 'woocommerce_product_image_upload_error') {
            // Try again without the image
            const dataWithoutImage = { ...wcProductData };
            delete dataWithoutImage.images;
            
            const wcProduct = await wcClient.createProduct(dataWithoutImage);
            
            product.wcProductId = wcProduct.id;
            product.status = "SYNCED_TO_WC";
            await product.save();
            
            return res.status(201).json({
              message: "Product created and synced with WooCommerce (without image)",
              product,
              warning: "Image could not be uploaded to WooCommerce due to format restrictions"
            });
          } else {
            throw syncError;
          }
        }
      } catch (wcError) {
        product.status = "SYNC_FAILED";
        await product.save();
        console.error("Failed to sync product with WooCommerce:", wcError);
        return res.status(201).json({
          message: "Product created locally but failed to sync with WooCommerce",
          product
        });
      }
    }
    
    res.status(201).json(product);
  }catch (err:any) {
    res.status(400).json({ message: err?.response?.data?.message || err.message || "Unknown error"  });
  }
};

// Import a product from WooCommerce to local database
export const importFromWooCommerce = async (req: AuthRequest, res: Response) => {
  try {
    const { wcProductId } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check if product already exists locally
    const existingProduct = await Product.findOne({ 
      userId, 
      wcProductId: wcProductId 
    });
    
    if (existingProduct) {
      return res.status(400).json({ 
        message: "Product already imported", 
        product: existingProduct 
      });
    }
    
    try {
      // Get WooCommerce credentials and fetch product details
      const credentials = await getWooCommerceCredentials(userId);
      const wcClient = createWcApiClient(credentials);
      
      const wcProduct = await wcClient.getProductById(wcProductId);
      
      // Create local product from WooCommerce data
      const newProduct = new Product({
        name: wcProduct.name,
        description: wcProduct.description,
        price: wcProduct.regular_price || wcProduct.price,
        imageUrl: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null,
        userId, // Ensure userId is included
        wcProductId: wcProduct.id,
        status: "SYNCED_TO_WC",
      });
      
      await newProduct.save();
      
      res.status(201).json({
        message: "Product imported successfully",
        product: newProduct
      });
    } catch (wcError: any) {
      res.status(400).json({ 
        message: "Failed to import product from WooCommerce", 
        error: wcError.message 
      });
    }
  } catch (err:any) {
    res.status(400).json({ message: err?.response?.data?.message || err.message || "Unknown error"  });
  }
};

// Update a product
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Find the product first
    const product = await Product.findOne({ _id: id, userId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Update in local database
    product.name = name;
    product.description = description;
    product.price = price;
    product.imageUrl = imageUrl;
    // Convert userId string to ObjectId if needed
    product.userId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    // If product was previously synced with WooCommerce, update there too
    if (product.wcProductId) {
      try {
        const credentials = await getWooCommerceCredentials(userId);
        const wcClient = createWcApiClient(credentials);
        
        await wcClient.updateProduct(product.wcProductId, {
          name,
          description,
          regular_price: price.toString(),
          images: imageUrl ? [{ src: imageUrl }] : []
        });
        
        product.status = "SYNCED_TO_WC";
      } catch (wcError) {
        product.status = "SYNC_FAILED";
        console.error(`Failed to update product ${id} in WooCommerce:`, wcError);
      }
    }
    
    await product.save();
    res.status(200).json(product);
  } catch (err:any) {
    res.status(400).json({ message: err?.response?.data?.message || err.message || "Unknown error"  });
  }
};

// Delete a product
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Find product with userId check to ensure proper authorization
    const product = await Product.findOne({ _id: id, userId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // If product exists in WooCommerce, delete it there first
    if (product.wcProductId) {
      try {
        const credentials = await getWooCommerceCredentials(userId);
        const wcClient = createWcApiClient(credentials);
        
        await wcClient.deleteProduct(product.wcProductId);
      } catch (wcError) {
        console.error(`Failed to delete product ${id} from WooCommerce:`, wcError);
        // Continue with local deletion even if WC deletion fails
      }
    }
    
    // Delete from local database, ensuring we only delete the user's own products
    await Product.findOneAndDelete({ _id: id, userId });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err:any) {
    res.status(400).json({ message: err?.response?.data?.message || err.message || "Unknown error"  });
  }
};

// Force sync a product with WooCommerce
export const syncProduct = async (req: AuthRequest, res: Response) => {
  console.log("Syncing product with WooCommerce...");
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Find the product and verify it belongs to the current user
    const product = await Product.findOne({ _id: id, userId });

    console.log("Product found:", product);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Ensure userId is still associated with the product (in case it was somehow omitted)
    if (!product.userId) {
      // Convert userId string to ObjectId
      product.userId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    }
    
    const credentials = await getWooCommerceCredentials(userId);
    const wcClient = createWcApiClient(credentials);
    
    // Prepare data for WooCommerce - validate images
    const wcProductData = prepareWooCommerceProductData(product);
    
    let wcProduct;
    
    try {
      // Update or create in WooCommerce depending on whether it already exists there
      if (product.wcProductId) {
        wcProduct = await wcClient.updateProduct(product.wcProductId, wcProductData);
      } else {
        wcProduct = await wcClient.createProduct(wcProductData);
        product.wcProductId = wcProduct.id;
      }
      
      product.status = "SYNCED_TO_WC";
      await product.save();
      
      res.status(200).json({ 
        message: "Product synced successfully with WooCommerce",
        product
      });
    } catch (syncError: any) {
      // Handle image upload error specifically
      if (syncError.response?.data?.code === 'woocommerce_product_image_upload_error') {
        // Try again without the image
        const dataWithoutImage = { ...wcProductData };
        delete dataWithoutImage.images;
        
        try {
          if (product.wcProductId) {
            wcProduct = await wcClient.updateProduct(product.wcProductId, dataWithoutImage);
          } else {
            wcProduct = await wcClient.createProduct(dataWithoutImage);
            product.wcProductId = wcProduct.id;
          }
          
          product.status = "SYNCED_TO_WC";
          await product.save();
          
          return res.status(200).json({ 
            message: "Product synced successfully with WooCommerce (without image due to format restrictions)",
            product,
            warning: "Image could not be uploaded to WooCommerce due to format restrictions"
          });
        } catch (retryError) {
          // If retry also fails, throw original error
          throw syncError;
        }
      } else {
        // Rethrow any other error
        throw syncError;
      }
    }
  } catch (err: any) {
    console.error("Sync error details:", err?.response?.data || err);
    res.status(400).json({ 
      message: err?.response?.data?.message || err.message || "Unknown error" 
    });
  }
};