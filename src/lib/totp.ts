/**
 * Genera un token alfanumérico determinista de 6 caracteres
 * utilizando el ID/Semilla y la ventana de tiempo actual de 4 horas.
 * No requiere conexión a internet para ser calculado.
 */
export function generarTokenOffline(seed: string, offset: number = 0): string {
  // Ventana de tiempo de 4 horas (14,400,000 milisegundos)
  const windowSize = 4 * 60 * 60 * 1000
  const timeWindow = Math.floor(Date.now() / windowSize) + offset
  const raw = `${seed}-${timeWindow}`
  
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0; // Convertir a entero de 32 bits
  }
  
  // Alfabeto libre de confusión visual (se omiten O, 0, I, 1)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  let temp = Math.abs(hash)
  for (let i = 0; i < 6; i++) {
    token += alphabet[temp % alphabet.length]
    temp = Math.floor(temp / alphabet.length)
  }
  return token
}
