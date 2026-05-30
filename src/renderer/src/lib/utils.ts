import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function cleanReleaseNotes(rawNotes?: string): string {
  if (!rawNotes) return ''

  let cleaned = rawNotes

  cleaned = cleaned.replace(/<p\s+align="center">[\s\S]*?<\/p>/gi, '')
  cleaned = cleaned.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, '')
  cleaned = cleaned.replace(/<hr\s*\/?>/gi, '')
  cleaned = cleaned.replace(/<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>/gi, '')

  return cleaned.trim()
}
