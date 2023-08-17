import crypto from 'crypto';


const algorithm = 'aes-256-cbc';
export function encrypt(data: string, password: string) {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv,
        data: encrypted.toString('hex')
    }
}

export function decrypt(payload: {
    iv: string;
    data: string;
} , key: string) {
    let derivedIV = Buffer.from(payload.iv, 'hex');
    let encryptedText = Buffer.from(payload.data, 'hex');

    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), derivedIV);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}