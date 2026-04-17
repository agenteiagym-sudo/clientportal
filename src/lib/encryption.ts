import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'tu_clave_aqui';

if (ENCRYPTION_KEY === 'tu_clave_aqui' && import.meta.env.PROD) {
  console.warn('WARNING: Using default ENCRYPTION_KEY in production. This is insecure and might cause decryption errors if the other app uses a different key.');
}

export async function encryptData(data: any): Promise<string> {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
}

export async function decryptData(ciphertext: string): Promise<any> {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('U2FsdGVkX1')) {
    return ciphertext;
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      return ciphertext;
    }

    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (e) {
    // If it's a UTF-8 error or any other decryption error, return the original ciphertext
    return ciphertext;
  }
}
