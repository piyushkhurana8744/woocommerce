import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../model/auth/user';
import cookieParser from 'cookie-parser';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper to set cookie
const setTokenCookie = (res: Response, token: string) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // send only over HTTPS in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

export const getUser = async (req: Request, res: Response) => {
    try{
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch(err){
        res.status(500).json({ message: 'Server error', error: err });
    }
}

// Signup Controller
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const user = await User.create({ name, email, password });
        const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        setTokenCookie(res, token);
        res.status(201).json({
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// Login Controller
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Create token
        const token = jwt.sign(
            { _id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// Logout Controller
export const logout = (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// app.use(cookieParser());

