import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar números
export function formatNumber(value: number | string, decimals: number = 1): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toFixed(decimals)
}

// Função para formatar data
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Data inválida'
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Função para obter cor baseada no risco
export function getRiskColor(risco: number | string): string {
  const riscoNum = typeof risco === 'string' ? parseFloat(risco) : risco
  if (isNaN(riscoNum)) return 'text-gray-600'
  
  if (riscoNum < 30) return 'text-green-600'
  if (riscoNum < 60) return 'text-yellow-600'
  if (riscoNum < 80) return 'text-orange-600'
  return 'text-red-600'
}

// Função para obter nível de alerta
export function getAlertLevel(risco: number | string): 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' {
  const riscoNum = typeof risco === 'string' ? parseFloat(risco) : risco
  if (isNaN(riscoNum)) return 'BAIXO'
  
  if (riscoNum < 30) return 'BAIXO'
  if (riscoNum < 60) return 'MEDIO'
  if (riscoNum < 80) return 'ALTO'
  return 'CRITICO'
}