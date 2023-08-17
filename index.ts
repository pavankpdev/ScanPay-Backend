import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import {HDNodeWallet} from 'ethers';
import {encrypt, decrypt} from "./utils/crypto";
import bcrypt from "bcryptjs";
import {getRow, insertRow, supabase} from "./providers/supabase";
import BIP39 from "bip39";

dotenv.config();

const app: Express = express();
app.use(express.json());

const port = process.env.PORT;

app.post('/seed/generate', async (req: Request, res: Response) => {
    const password = req.body.password;
    const email = req.body.email;

    const BIP39 = require('bip39')
    const mnemonic = BIP39.generateMnemonic();
    const {error} = await insertRow(
        'Users',
        {
            id: Date.now(),
            email,
            password: bcrypt.hashSync(password, 10),
            accounts: 0,
        }
    )

   if(error) {
         return res.status(400).json({
              error: "Error creating user",
              message: error?.message
         })
   }

    return res.json({
        seed: encrypt(mnemonic, password as string),
    });
});

app.post('/account/new', async (req: Request, res: Response) => {
    const encryptedSeed: string = req.body.seed;
    const password: string = req.body.password;
    const name: string = req.body.name;
    const email: string = req.body.email;

    const BIP39 = require('bip39')

    const mnemonic = decrypt(encryptedSeed, password);
    console.log(mnemonic)
    const seed = await BIP39.mnemonicToSeed(mnemonic);
    const wallet = HDNodeWallet.fromSeed(seed as any);

    // Save wallet count to database
    let { data, error } = await supabase
        .rpc('increment', {
            useremail: email
        })

    console.log(error)
    return res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        name
    })
})

app.post('/seed/recover', async (req: Request, res: Response) => {
    const mnemonic: string = req.body.mnemonic;
    const email: string = req.body.email;

    const BIP39 = require('bip39')

    if(!BIP39.validateMnemonic(mnemonic)) {
        return res.status(400).json({
            error: "Invalid mnemonic"
        })
    }

    const {data: user, error} = await getRow('Users', 'email', email);
    console.log(user)
    if(!user || error) {
        return res.status(400).json({
            error: "User not found"
        })
    }

    const accounts = user.accounts;

    const seed = await BIP39.mnemonicToSeed(mnemonic);
    const wallet = HDNodeWallet.fromSeed(seed as any);
    return res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
    })
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});