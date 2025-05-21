import { Request } from 'express';

export type AuthRequest = Request & {
  user?: {
    _id: string;
    role: string;
  };
};
