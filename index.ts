import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import {HDNodeWallet} from 'ethers';
import {encrypt} from "./utils/crypto";

dotenv.config();

const app: Express = express();
app.use(express.json());

const port = process.env.PORT;

app.post('/seed/generate', async (req: Request, res: Response) => {
    const password = req.body.password;
    const BIP39 = require('bip39')
    const mnemonic = BIP39.generateMnemonic();
    console.log(mnemonic)

    return res.json({
        seed: encrypt(mnemonic, password as string),
    });
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});