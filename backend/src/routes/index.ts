import express from 'express';

import authRoutes from './auth';
import productRoutes from './product';
import integrationRoutes from './integration';
 
const allRoutes = express.Router();

allRoutes.use('/auth', authRoutes);
allRoutes.use('/product', productRoutes); 
allRoutes.use('/integration', integrationRoutes);

export default allRoutes;