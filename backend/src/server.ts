import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// --- ROTA DE APOIO: Criar Restaurante (Necessário para vincular o Estoque) ---
app.post('/restaurantes', async (req, res) => {
  const { cnpj, nome, email, telefone, cep, cidade, endereco } = req.body;
  const restaurante = await prisma.restaurante.create({
    data: { cnpj, nome, email, telefone, cep, cidade, endereco },
  });
  return res.status(201).json(restaurante);
});

// --- CRUD DE ESTOQUE ---

// 1. Criar Estoque (Create)
app.post('/estoques', async (req, res) => {
  const { endereco, cep, restauranteId } = req.body;

  // Verifica se o restaurante existe antes de criar o estoque
  const restauranteExiste = await prisma.restaurante.findUnique({
    where: { id: Number(restauranteId) },
  });

  if (!restauranteExiste) {
    return res.status(404).json({ erro: 'Restaurante informado não existe.' });
  }

  const estoque = await prisma.estoque.create({
    data: {
      endereco,
      cep,
      restauranteId: Number(restauranteId),
    },
  });

  return res.status(201).json(estoque);
});

// 2. Listar Estoques (Read) com dados do Restaurante associado
app.get('/estoques', async (req, res) => {
  const estoques = await prisma.estoque.findMany({
    include: {
      restaurante: true, // Traz os dados do restaurante dono deste estoque
    },
  });
  return res.json(estoques);
});

// 3. Atualizar Estoque (Update)
app.put('/estoques/:id', async (req, res) => {
  const { id } = req.params;
  const { endereco, cep } = req.body;

  const estoque = await prisma.estoque.update({
    where: { id: Number(id) },
    data: { endereco, cep },
  });

  return res.json(estoque);
});

// 4. Deletar Estoque (Delete)
app.delete('/estoques/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.estoque.delete({
    where: { id: Number(id) },
  });

  return res.status(204).send();
});

app.listen(3333, () => {
  console.log('🚀 Servidor Express rodando em http://localhost:3333');
});