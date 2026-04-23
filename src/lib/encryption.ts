
export async function encryptData(data: any): Promise<string> {
  try {
    const response = await fetch('/api/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Cifrado: Respuesta no JSON del servidor', text.substring(0, 100));
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cifrar datos');
    }
    
    const result = await response.json();
    return result.ciphertext;
  } catch (error) {
    console.error('Encryption API error:', error);
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

export async function decryptData(ciphertext: string): Promise<any> {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('U2FsdGVkX1')) {
    return ciphertext;
  }

  try {
    const response = await fetch('/api/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciphertext })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Descifrado: Respuesta no JSON del servidor', text.substring(0, 100));
      return ciphertext;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al descifrar datos');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Decryption API error:', error);
    return ciphertext;
  }
}
