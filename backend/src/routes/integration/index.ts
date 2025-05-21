import express from 'express';

import {connectWooCommerce} from '../../controllers/integration';
import { isAuthenticated } from '../../middlewares';



const integrationRoutes = express.Router();
integrationRoutes.post('/connect-woocommerce',isAuthenticated, connectWooCommerce);

export default integrationRoutes;