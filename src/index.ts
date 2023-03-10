import { PrismaClient } from "@prisma/client";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { VerifyErrors } from "jsonwebtoken";
require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(
  `/trainers/signup`,
  async (req: express.Request, res: express.Response) => {
    const {
      name,
      last_name,
      email,
      username,
      password: plainPassword,
    } = req.body;

    const foundTrainers = await prisma.trainer.findMany({
      where: {
        OR: [
          {
            username,
          },
          {
            email,
          },
        ],
      },
    });

    if (foundTrainers.length) {
      res.status(400).json({
        error: "The email or username already exists",
      });
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const createdTrainer = await prisma.trainer.create({
        data: {
          id: uuidv4(),
          name,
          last_name,
          email,
          username,
          password: hashedPassword,
        },
      });

      res.status(200).json({
        message: "The trainer was successfully created",
        data: {
          trainer: createdTrainer,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "error creating the trainer" });
    }
  }
);

app.post(
  `/trainers/login`,
  async (req: express.Request, res: express.Response) => {
    const { email, password: plainPassword } = req.body;

    try {
      const foundTrainer = await prisma.trainer.findUnique({
        where: { email: email },
      });

      if (!foundTrainer) {
        res.status(403).json({ error: "Invalid email or password" });
        return;
      }

      const isPasswordMatching = await bcrypt.compare(
        plainPassword,
        foundTrainer.password
      );

      if (!isPasswordMatching) {
        res.status(403).json({ error: "Invalid email or password" });
        return;
      }

      const token = jwt.sign({ foundTrainer }, process.env.SECRET);
      res.json({
        data: {
          access_token: token,
          trainer: foundTrainer,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  `/trainers/delete/:id`,
  verifyToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      // @todo: check if the id from my jwt is the same I wanna remove.
      const trainerDeleted = await prisma.trainer.delete({
        where: { id: id },
      });

      if (!trainerDeleted) {
        res.status(403).json({ error: "Something is not working" });
        return;
      }

      res.json(trainerDeleted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/trainers/profile/:id",
  verifyToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      // @todo: do we want to show the email or the password to anyone is requesting the profile?
      const userInfo = await prisma.trainer.findUnique({
        where: {
          id: id,
        },
      });

      if (!userInfo) {
        res.status(403).json({ error: "Something is not working" });
        return;
      }

      return res.json({
        data: {
          trainer: userInfo,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

function verifyToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader === "undefined") {
    res = injectErrorWhileReadingJWT(res);
    return;
  }

  let token: String;
  try {
    token = bearerHeader.split(" ")[1];
  } catch (e) {
    res = injectErrorWhileReadingJWT(res);
    return;
  }

  jwt.verify(token, process.env.SECRET, (error?: VerifyErrors) => {
    if (error) {
      res = injectErrorWhileReadingJWT(res);
      return;
    }

    next();
  });
}

const injectErrorWhileReadingJWT = (
  res: express.Response
): express.Response => {
  res.status(403).json({
    error: "Something went wrong while validating the token",
  });
  return res;
};

app.listen(3000, () =>
  console.log("REST API server ready at: http://localhost:3000")
);
