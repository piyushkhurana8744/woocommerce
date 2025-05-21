import express from 'express';
import { signup, login,logout,getUser } from "../../controllers/auth/index";
import { isAuthenticated } from '../../middlewares';


const authRoutes = express.Router();

authRoutes.get('/me',isAuthenticated, getUser);
authRoutes.post('/signup', signup);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
export default authRoutes;