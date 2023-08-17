import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import {HDNodeWallet, ethers} from 'ethers';
import {encrypt, decrypt} from "./utils/crypto";

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

app.post('/account/new', async (req: Request, res: Response) => {
    const seed: string = req.body.seed;
    const password: string = req.body.password;
    const name = req.body.name;
    const BIP39 = require('bip39')

    const mnemonic = decrypt(seed, password);
    const seeds = await BIP39.mnemonicToSeed(mnemonic);
    const wallet = HDNodeWallet.fromSeed(seeds as any);
    return res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        name
    })
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});