import { headers } from 'next/headers'

const ATTEMPT_LIMIT = 3
const BLOCK_DURATION = 24 * 60 * 60 * 1000 // 24 horas

interface AttemptRecord {
  count: number
  blockedUntil: number
}

// Registro en memoria para entornos de desarrollo/servidores locales
const attemptsMap = new Map<string, AttemptRecord>()

export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  const xForwardedFor = headersList.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  return headersList.get('x-real-ip') || '127.0.0.1'
}

export function isIpBlocked(ip: string): boolean {
  const record = attemptsMap.get(ip)
  if (!record) return false
  if (Date.now() > record.blockedUntil) {
    // El bloqueo expiró
    attemptsMap.delete(ip)
    return false
  }
  return record.count >= ATTEMPT_LIMIT
}

export function recordFailedAttempt(ip: string) {
  const record = attemptsMap.get(ip) || { count: 0, blockedUntil: 0 }
  record.count += 1
  if (record.count >= ATTEMPT_LIMIT) {
    record.blockedUntil = Date.now() + BLOCK_DURATION
    console.warn(`[SEGURIDAD] IP ${ip} ha sido bloqueada temporalmente tras ${ATTEMPT_LIMIT} intentos fallidos.`);
  }
  attemptsMap.set(ip, record)
}

export function resetAttempts(ip: string) {
  attemptsMap.delete(ip)
}
