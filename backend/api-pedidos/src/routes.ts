import { Router } from 'express'
import { db, parseId, StatusPedido } from '@geroncio/shared-db'

const routes = Router()

routes.get('/pedidos', async (req, res) => {
  const pedidos = await db.pedido.findMany({
    include: { cliente: true, itens: { include: { produto: true } }, entrega: true },
  })
  res.json(pedidos)
})

routes.get('/pedidos/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const pedido = await db.pedido.findUnique({
    where: { id },
    include: { cliente: true, itens: { include: { produto: true } }, entrega: true },
  })
  if (!pedido) {
    res.status(404).json({ error: 'Pedido não encontrado' })
    return
  }
  res.json(pedido)
})

routes.post('/pedidos', async (req, res) => {
  const { clienteId, preco, metodoPagamento, app, enderecoDestino, cepDestino, latitude, longitude, itens } = req.body

  if (preco === undefined || !metodoPagamento || !app || !enderecoDestino || !cepDestino) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes' })
    return
  }

  const pedido = await db.pedido.create({
    data: {
      clienteId: clienteId === undefined ? null : Number(clienteId),
      preco,
      metodoPagamento,
      app,
      enderecoDestino,
      cepDestino,
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      itens: Array.isArray(itens)
        ? {
            create: itens.map((item: { produtoId: number; quantidade: number }) => ({
              produtoId: Number(item.produtoId),
              quantidade: Number(item.quantidade),
            })),
          }
        : undefined,
    },
    include: { itens: true },
  })
  res.status(201).json(pedido)
})

routes.patch('/pedidos/:id/status', async (req, res) => {
  const id = parseId(req.params.id)
  const { status } = req.body

  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }
  if (!Object.values(StatusPedido).includes(status)) {
    res.status(400).json({
      error: `status deve ser um de: ${Object.values(StatusPedido).join(', ')}`,
    })
    return
  }

  const existente = await db.pedido.findUnique({ where: { id } })
  if (!existente) {
    res.status(404).json({ error: 'Pedido não encontrado' })
    return
  }

  const pedido = await db.pedido.update({ where: { id }, data: { status } })
  res.json(pedido)
})

routes.delete('/pedidos/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const existente = await db.pedido.findUnique({ where: { id } })
  if (!existente) {
    res.status(404).json({ error: 'Pedido não encontrado' })
    return
  }

  await db.pedido.delete({ where: { id } })
  res.status(204).send()
})

export default routes
