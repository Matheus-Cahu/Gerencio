import { Router } from 'express'
import { db, parseId } from '@geroncio/shared-db'

const routes = Router()

routes.get('/clientes', async (req, res) => {
  const clientes = await db.cliente.findMany()
  res.json(clientes)
})

routes.get('/clientes/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    res.status(400).json({ error: 'Id inválido' })
    return
  }

  const cliente = await db.cliente.findUnique({ where: { id }, include: { pedidos: true } })
  if (!cliente) {
    res.status(404).json({ error: 'Cliente não encontrado' })
    return
  }
  res.json(cliente)
})

routes.post('/clientes', async (req, res) => {
  const { nomeCliente, endereco, telefone, email, cpf } = req.body

  if (!nomeCliente || !endereco) {
    res.status(400).json({ error: 'nomeCliente e endereco são obrigatórios' })
    return
  }

  const cliente = await db.cliente.create({
    data: { nomeCliente, endereco, telefone, email, cpf },
  })
  res.status(201).json(cliente)
})

export default routes
