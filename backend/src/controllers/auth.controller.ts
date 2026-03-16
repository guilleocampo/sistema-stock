import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ data: null, error: 'Credenciales requeridas', message: 'Credenciales requeridas' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { username } });

  if (!usuario || !usuario.activo) {
    return res.status(401).json({ data: null, error: 'Credenciales inválidas', message: 'Credenciales inválidas' });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);

  if (!passwordValida) {
    return res.status(401).json({ data: null, error: 'Credenciales inválidas', message: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username, rol: usuario.rol },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  return res.json({
    data: { token, usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol } },
    error: null,
    message: 'Login exitoso',
  });
}
