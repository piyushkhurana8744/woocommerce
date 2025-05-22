import express from 'express';

import {connectWooCommerce,getIntegrations} from '../../controllers/integration';
import { isAuthenticated } from '../../middlewares';



const integrationRoutes = express.Router();
integrationRoutes.get('/get-integrations',isAuthenticated, getIntegrations);
integrationRoutes.post('/connect-woocommerce',isAuthenticated, connectWooCommerce);

export default integrationRoutes;