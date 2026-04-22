// ─── Auth ────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  tenantId: string
  userId: string
  email: string
  role: 'admin' | 'member'
}

// ─── Tenant ───────────────────────────────────────────────────────────────────
export interface Tenant {
  _id?: string
  name: string
  email: string // owner email
  createdAt: Date
}

// ─── Magic Link Token ─────────────────────────────────────────────────────────
export interface MagicToken {
  _id?: string
  email: string
  tenantId: string
  token: string
  expiresAt: Date
  used: boolean
}

// Tipo para documentos devueltos por la API (incluyen _id como string serializado)
export type WithId<T> = T & { _id: string }

// ─── Cliente ──────────────────────────────────────────────────────────────────
export interface Cliente {
  tenantId: string
  name: string
  email: string
  tags: string[]
  metadata: Record<string, string>
  active: boolean
  createdAt: Date
}

// ─── Plantilla ────────────────────────────────────────────────────────────────
export interface Plantilla {
  tenantId: string
  name: string
  subject: string
  htmlBody: string
  variables: string[]
  createdAt: Date
  updatedAt: Date
}

// ─── Campaña ──────────────────────────────────────────────────────────────────
export type CampanaStatus = 'draft' | 'sending' | 'sent' | 'failed'
export type RecipientStatus = 'sent' | 'failed'

export interface RecipientLog {
  recipientEmail: string
  recipientName: string
  status: RecipientStatus
  sentAt: Date
  error?: string
}

export interface Campana {
  tenantId: string
  name: string
  plantillaId: string
  plantillaName: string
  segment: 'all' | string // 'all' o un tag
  status: CampanaStatus
  logs: RecipientLog[]
  createdAt: Date
  sentAt?: Date
}
