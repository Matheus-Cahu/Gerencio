import { Router } from 'express'
import { db, parseId } from '@geroncio/shared-db'

const routes = Router()

// ============================================
// RESTAURANTES
// ============================================

// CREATE
routes.post('/restaurantes', async (req, res) => {
  const { cnpj, nome, email, telefone, cep, cidade, endereco } = req.body

  if (!cnpj || !nome || !email || !telefone || !cep || !cidade || !endereco) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes' })
    return
  }

  const restaurante = await db.restaurante.create({
    data: { cnpj, nome, email, telefone, cep, cidade, endereco },
  })
  res.status(201).json(restaurante)
})

// READ (todos)
routes.get('/restaurantes', async (req, res) => {
  const restaurantes = await db.restaurante.findMany()
  res.json(restaurantes)
})

// READ (um)
routes.get('/restaurantes/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const restaurante = await db.restaurante.findUnique({ where: { id } })
  if (!restaurante) {
    res.status(404).json({ error: 'Restaurante não encontrado' })
    return
  }
  res.json(restaurante)
})

// UPDATE
routes.put('/restaurantes/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const { cnpj, nome, email, telefone, cep, cidade, endereco } = req.body

  const restauranteExiste = await db.restaurante.findUnique({ where: { id } })
  if (!restauranteExiste) {
    res.status(404).json({ error: 'Restaurante não encontrado' })
    return
  }

  const restaurante = await db.restaurante.update({
    where: { id },
    data: { cnpj, nome, email, telefone, cep, cidade, endereco },
  })

  res.json(restaurante)
})

// DELETE
routes.delete('/restaurantes/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const restauranteExiste = await db.restaurante.findUnique({ where: { id } })
  if (!restauranteExiste) {
    res.status(404).json({ error: 'Restaurante não encontrado' })
    return
  }

  await db.restaurante.delete({ where: { id } })
  res.status(204).send()
})

// ============================================
// PRODUTOS
// ============================================

// CREATE
routes.post('/produtos', async (req, res) => {
  const { nome, preco } = req.body

  if (!nome || preco === undefined) {
    res.status(400).json({ error: 'nome e preco são obrigatórios' })
    return
  }

  const produto = await db.produto.create({
    data: { nome, preco: Number(preco) },
  })
  res.status(201).json(produto)
})

// READ (todos)
routes.get('/produtos', async (req, res) => {
  const produtos = await db.produto.findMany({
    include: {
      estoques: { include: { restaurante: true } },
      mapeamentos: true,
    },
  })
  res.json(produtos)
})

// READ (um)
routes.get('/produtos/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const produto = await db.produto.findUnique({
    where: { id },
    include: {
      estoques: { include: { restaurante: true } },
      mapeamentos: true,
    },
  })
  if (!produto) {
    res.status(404).json({ error: 'Produto não encontrado' })
    return
  }
  res.json(produto)
})

// UPDATE
routes.put('/produtos/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const { nome, preco } = req.body

  const produtoExiste = await db.produto.findUnique({ where: { id } })
  if (!produtoExiste) {
    res.status(404).json({ error: 'Produto não encontrado' })
    return
  }

  const produto = await db.produto.update({
    where: { id },
    data: {
      nome,
      preco: preco !== undefined ? Number(preco) : undefined,
    },
  })
  res.json(produto)
})

// DELETE
routes.delete('/produtos/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const produtoExiste = await db.produto.findUnique({ where: { id } })
  if (!produtoExiste) {
    res.status(404).json({ error: 'Produto não encontrado' })
    return
  }

  await db.produto.delete({ where: { id } })
  res.status(204).send()
})

// ============================================
// ESTOQUE DO RESTAURANTE
// ============================================

routes.get('/restaurantes/:id/estoque', async (req, res) => {
  const restauranteId = parseId(req.params.id)
  if (restauranteId === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const estoque = await db.estoqueProduto.findMany({
    where: { restauranteId },
    include: { produto: true },
  })
  res.json(estoque)
})

routes.post('/restaurantes/:id/estoque', async (req, res) => {
  const restauranteId = parseId(req.params.id)
  const produtoId = parseId(String(req.body.produtoId))
  const quantidade = Number(req.body.quantidade)

  if (restauranteId === null || produtoId === null || !Number.isInteger(quantidade)) {
    res.status(400).json({ error: 'restauranteId, produtoId e quantidade são obrigatórios' })
    return
  }

  const restaurante = await db.restaurante.findUnique({ where: { id: restauranteId } })
  if (!restaurante) {
    res.status(404).json({ error: 'Restaurante informado não existe.' })
    return
  }

  const produto = await db.produto.findUnique({ where: { id: produtoId } })
  if (!produto) {
    res.status(404).json({ error: 'Produto informado não existe.' })
    return
  }

  const existente = await db.estoqueProduto.findFirst({ where: { restauranteId, produtoId } })

  const item = existente
    ? await db.estoqueProduto.update({ where: { id: existente.id }, data: { quantidade } })
    : await db.estoqueProduto.create({ data: { restauranteId, produtoId, quantidade } })

  res.status(existente ? 200 : 201).json(item)
})

routes.put('/estoque/:id', async (req, res) => {
  const id = parseId(req.params.id)
  const quantidade = Number(req.body.quantidade)

  if (id === null || !Number.isInteger(quantidade)) {
    res.status(400).json({ error: 'Id inválido ou quantidade ausente' })
    return
  }

  const existente = await db.estoqueProduto.findUnique({ where: { id } })
  if (!existente) {
    res.status(404).json({ error: 'Item de estoque não encontrado' })
    return
  }

  const item = await db.estoqueProduto.update({ where: { id }, data: { quantidade } })
  res.json(item)
})

routes.delete('/estoque/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const existente = await db.estoqueProduto.findUnique({ where: { id } })
  if (!existente) {
    res.status(404).json({ error: 'Item de estoque não encontrado' })
    return
  }

  await db.estoqueProduto.delete({ where: { id } })
  res.status(204).send()
})

export default routes