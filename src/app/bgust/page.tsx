import { notFound } from 'next/navigation'
import { getClientIp, isIpBlocked } from '@/lib/security'
import { AdminLoginForm } from './AdminLoginForm'

export default async function BgustPage() {
  const ip = await getClientIp()
  
  // 1. Si la IP está bloqueada, devolvemos 404 para ocultar la ruta
  if (isIpBlocked(ip)) {
    notFound()
  }

  // 2. Si no está bloqueada, mostramos el login administrativo
  return <AdminLoginForm />
}
