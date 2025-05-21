import { Router } from "express";
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  syncProduct,
  checkWooCommerceProduct,
importFromWooCommerce
} from "../../controllers/product/index";
import { isAuthenticated } from "../../middlewares/index";

const router = Router();

router.post("/:id/sync", isAuthenticated, syncProduct);
router.get("/",isAuthenticated, getProducts);
router.post("/", isAuthenticated, addProduct);
router.put("/:id", isAuthenticated, updateProduct);
router.delete("/:id", isAuthenticated, deleteProduct);


// New endpoints for WooCommerce integration
router.post("/check", isAuthenticated, checkWooCommerceProduct);
router.post("/import", isAuthenticated, importFromWooCommerce);

export default router;