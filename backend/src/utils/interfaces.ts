import { Socket } from 'socket.io';
import { User } from '@prisma/client';

export interface AuthenticatedSocket extends Socket {
  user?: User;
}