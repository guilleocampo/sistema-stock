import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USER;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!username || !plainPassword) {
    throw new Error('Faltan ADMIN_USER o ADMIN_PASSWORD en el archivo .env');
  }

  const existente = await prisma.usuario.findUnique({ where: { username } });

  if (existente) {
    console.log(`Usuario "${username}" ya existe. No se creó uno nuevo.`);
    return;
  }

  const password = await bcrypt.hash(plainPassword, 10);

  const usuario = await prisma.usuario.create({
    data: { username, password, rol: 'ADMIN' },
  });

  console.log(`Usuario administrador creado: ${usuario.username} (id: ${usuario.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
