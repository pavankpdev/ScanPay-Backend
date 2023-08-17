import crypto from 'crypto';


const algorithm = 'aes-256-cbc';
export function encrypt(data: string, password: string) {
    const iv = Buffer.from(crypto.createHash('sha256').update(password).digest('base64').substr(0, 16))
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex')
}

export function decrypt(data: string, password: string) {
    const iv = Buffer.from(crypto.createHash('sha256').update(password).digest('base64').substr(0, 16))
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32);
    let encryptedText = Buffer.from(data, 'hex');

    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}