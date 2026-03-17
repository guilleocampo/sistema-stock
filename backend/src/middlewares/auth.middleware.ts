import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  username: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ data: null, error: 'Token no proporcionado', message: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ data: null, error: 'Token inválido o expirado', message: 'No autorizado' });
  }
}

export function verificarRol(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ data: null, error: 'No autenticado', message: 'No autorizado' });
    }

    if (req.usuario.rol === 'ADMIN') {
      return next();
    }

    if (roles.includes(req.usuario.rol)) {
      return next();
    }

    return res.status(403).json({ data: null, error: 'Sin permisos suficientes', message: 'Acceso denegado' });
  };
}
