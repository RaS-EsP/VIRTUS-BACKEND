import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks';
import { verify } from 'crypto';
import express from 'express'
import {v4 as uuidv4} from "uuid"
require("dotenv").config();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient()
const app = express()

app.use(express.json())


  app.post(`/trainers/signup`, async (req, res) => {
    let myuuid = uuidv4()
    const id = myuuid
    const {name, last_name, email, username, password: plainPassword } = req.body
    const password = await bcrypt.hash(plainPassword,10)
    const existingEmail = await prisma.trainer.findUnique({
      where: {
        email
      }
    })
    const existingUsername = await prisma.trainer.findFirst({
      where: {
        username
      }
    })
    if (existingEmail || existingUsername) {
      res.status(400).json({ 'error': 'The email or username already exists' })
  }
    else { 
      try{
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
    res.status(200).json({ message: 'The trainer was successfully created' });
  } 
  catch(error){
    res.status(500).json({error : 'error creating the trainer'})
  }
  }
    
  })


  app.post(`/trainers/login`, async (req, res) => {
    const { email, password: plainPassword } = req.body;
    try {
      const userInfo = await prisma.trainer.findUnique({
        where: { email: email },
      });
      if (!userInfo) {
        res.status(403).json({ error: 'Invalid email or password' });
        return;
      }
      const isMatch = await bcrypt.compare(plainPassword, userInfo.password);
      if (!isMatch) {
        res.status(403).json({ error: 'Invalid email or password' });
        return;
      }
      const token = jwt.sign({ userInfo }, process.env.SECRET);
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete(`/trainers/delete/:id`, verifyToken, async (req, res) => {
    try{
      const { id } = req.params
      const trainerDeleted = await prisma.trainer.delete({
        where: { id: id },
      }) 
      if (!trainerDeleted){
        res.status(403).json({ error: 'Something is not working' });
        return;
      }
      res.json(trainerDeleted)
    }catch(error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
 
  app.get("/trainers/profile/:id", verifyToken, async (req: any, res) => {
    try{
      const { id } = req.params
      const userInfo = await prisma.trainer.findUnique({
        where:{
          id: id
        }
      })
      if (!userInfo){
        res.status(403).json({ error: 'Something is not working' });
        return;
      }
      return res.json(userInfo)
    } catch(error){
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  
  // FUNCION DE VERIFICADO DE TOKEN 
  function verifyToken(req: any, res: any, next: any) {
    const bearerHeader = req.headers['authorization']
    if(typeof bearerHeader !== 'undefined'){
      const bearerToken = bearerHeader.split(" ")[1]
      req.token = bearerToken
      jwt.verify(req.token, process.env.SECRET,(error: any, authData:any) =>{
        if(error){
          console.log("error jwt verify")
          res.sendStatus(403)
        }
        else{
          console.log("Working")
          next()
          }
      
    })}
    else{
      res.sendStatus(403)
    }
    
  }
    // FUNCION DE VERIFICADO DE TOKEN 
app.listen(3000, () =>
  console.log('REST API server ready at: http://localhost:3000'),
)