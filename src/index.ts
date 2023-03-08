import { PrismaClient } from '@prisma/client'
import express from 'express'

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

app.get('/trainers', async (req, res) => {
    const trainers = await prisma.trainer.findMany()
    res.json(trainers)
  })
  app.get(`/trainers/:id`, async (req, res) => {

    const { id }  = req.params
    const post = await prisma.trainer.findUnique({
      where: { id: id },
    })
    res.json(post)
  })

  app.post(`/trainers`, async (req, res) => {
    const { name, last_name, email, username } = req.body
    const result = await prisma.trainer.create({
      data: {
        name,
        last_name,
        email,
        username,
      },
    })
    res.json(result)
  })

  app.delete(`/trainers/:id`, async (req, res) => {
    const { id } = req.params
    const post = await prisma.trainer.delete({
      where: { id: id },
    })
    res.json(post)
  })

app.listen(3000, () =>
  console.log('REST API server ready at: http://localhost:3000'),
)