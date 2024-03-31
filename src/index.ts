import express, { Request, Response } from 'express';

import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql';
import contactRouter from './routers/contact';
import { connectDb, db } from './config/dbConnection';
const app = express();

app.use(bodyParser.json());
app.use(cors());
connectDb();
app.use('/',contactRouter)
const port = 8000;
app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
})