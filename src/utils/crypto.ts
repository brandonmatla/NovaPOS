const textEncoder = new TextEncoder()

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

const toArrayBuffer = (value: ArrayBuffer | SharedArrayBuffer): ArrayBuffer => {
  return value.slice(0) as ArrayBuffer
}

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const toHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const PBKDF2_ITERATIONS = 310000
export const PBKDF2_HASH = 'SHA-256'

export const createSalt = (length = 16): string => {
  const salt = new Uint8Array(length)
  crypto.getRandomValues(salt)
  return toBase64(salt.buffer)
}

export const hashPassword = async (password: string, salt = createSalt()): Promise<{ salt: string; hash: string }> => {
  const passwordKey = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(fromBase64(salt).buffer),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    passwordKey,
    256,
  )

  return {
    salt,
    hash: toBase64(derivedBits),
  }
}

export const verifyPassword = async (password: string, salt: string, expectedHash: string): Promise<boolean> => {
  const { hash } = await hashPassword(password, salt)
  return hash === expectedHash
}

export const sha256Hex = async (input: ArrayBuffer | Uint8Array): Promise<string> => {
  const buffer = input instanceof Uint8Array ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) : toArrayBuffer(input)
  const digest = await crypto.subtle.digest('SHA-256', buffer as ArrayBuffer)
  return toHex(digest)
}