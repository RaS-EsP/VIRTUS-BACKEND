import { PrismaClient } from '@prisma/client'
import express from 'express'
import {v4 as uuidv4} from "uuid"
const bcrypt = require('bcrypt');

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

  app.post(`/trainers/signup`, async (req, res) => {
    let myuuid = uuidv4()
    const id = myuuid
    const {name, last_name, email, username, password: plainPassword } = req.body
    const password = await bcrypt.hash(plainPassword,10)
    const result = await prisma.trainer.create({
      data: {
        id,
        name,
        last_name,
        email,
        username,
        password
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