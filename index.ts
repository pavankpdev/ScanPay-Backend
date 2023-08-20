import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import {HDNodeWallet, getDefaultProvider} from 'ethers';
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
        mnemonic
    });
});

app.post('/account/new', async (req: Request, res: Response) => {
    const encryptedSeed: string = req.body.seed;
    const password: string = req.body.password;
    const name: string = req.body.name;
    const email: string = req.body.email;

    const mnemonic = decrypt(encryptedSeed, password);
    const HDWallet = HDNodeWallet.fromPhrase(mnemonic);

    // Save wallet count to database
    let { error } = await supabase
        .rpc('increment', {
            useremail: email
        })

    if (error) {
        return res.status(400).json({
            error: "Error creating account",
            message: error?.message
        })
    }

    const {data: user, error: getUserError} = await getRow('Users', 'email', email);
    if(!user || getUserError) {
        return res.status(400).json({
            error: "User not found"
        })
    }

    const accounts = user.accounts;

    const wallet = HDWallet.derivePath(`m/44'/60'/0'/0/${accounts}`)
    return res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        name
    })
})

app.post('/seed/recover', async (req: Request, res: Response) => {
    const mnemonic: string = req.body.mnemonic;
    const email: string = req.body.email;
    const password: string = req.body.password;

    const BIP39 = require('bip39')

    if(!BIP39.validateMnemonic(mnemonic)) {
        return res.status(400).json({
            error: "Invalid mnemonic"
        })
    }

    const {data: user, error} = await getRow('Users', 'email', email);
    if(!user || error) {
        return res.status(400).json({
            error: "User not found"
        })
    }

    const accounts = user.accounts;

    const HDWallet = HDNodeWallet.fromPhrase(mnemonic);

    const recoveredWallets: Array<{address: string, privateKey: string, name: string}> = [];

    for (let i = 0; i < accounts; i++) {
        const wallet = HDWallet.derivePath(`m/44'/60'/0'/0/${i + 1}`)
        recoveredWallets.push({
            address: wallet.address,
            privateKey: wallet.privateKey,
            name: `Account ${i + 1}`
        })
    }

    return res.json({
        wallets: recoveredWallets,
        seed: encrypt(mnemonic, password as string),
    })
})

app.post('/seed/verify', async (req: Request, res: Response) => {
    const enteredMnemonic: string = req.body.mnemonic;
    const encryptedSeed: string = req.body.seed;
    const password: string = req.body.password;

    const mnemonic = decrypt(encryptedSeed, password);
    console.log(enteredMnemonic.toLowerCase() === mnemonic.toLowerCase())

    if(enteredMnemonic.toLowerCase() === mnemonic.toLowerCase()) {
        return res.json({
            verified: true
        })
    }

    return res.status(401).json({
        verified: false
    })

})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});