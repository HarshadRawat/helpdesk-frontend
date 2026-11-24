export type Role =
  | 'CUSTOMER'
  | 'AGENT'
  | 'ADMIN'
  | 'ROLE_CUSTOMER'
  | 'ROLE_AGENT'
  | 'ROLE_ADMIN'
  | 'ROLE_USER'
  | 'ROLE_SUPPORT'

export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface User {
  id: number
  fullName: string
  name?: string
  email: string
  role: Role
  department?: string
  phoneNumber?: string
  active?: boolean
}

export interface LoginResponse {
  token?: string
  accessToken?: string
  refreshToken: string
  type?: string
  user?: User
}

export interface Ticket {
  id: number
  title: string
  description: string
  status: Status
  priority: Priority
  category?: string
  version: number
  createdById: number
  createdByName: string
  assignedToId?: number | null
  assignedToName?: string | null
  slaDueAt?: string | null
  slaBreached?: boolean
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
}

export interface TicketRequest {
  title: string
  description: string
  priority: Priority
}

export interface TicketUpdateRequest {
  title: string
  description: string
  priority: Priority
  version: number
}

export interface StatusUpdateRequest {
  status: Status
  resolutionNotes?: string
  version: number
}

export interface AssignTicketRequest {
  assignedToId: number
  version: number
}

export interface Comment {
  id: number
  ticketId?: number
  userId?: number
  userName?: string
  message: string
  internal?: boolean
  isInternal?: boolean
  authorName?: string
  authorRole?: Role
  content?: string
  internalOnly?: boolean
  createdAt: string
}

export interface CommentRequest {
  message: string
  isInternal?: boolean
}

export interface TicketAttachment {
  id: number
  ticketId: number
  fileName: string
  fileType: string
  fileSize: number
  uploadedById: number
  uploadedByName: string
  createdAt: string
}

export interface AuditLog {
  id: number
  entityType: string
  entityId: number
  action: string
  performedById?: number
  performedByName?: string
  performedByRole?: string
  actorId?: number
  oldValue?: string
  newValue?: string
  details?: string
  timestamp?: string
  createdAt?: string
}

export interface AgentWorkload {
  agentId: number
  agentName: string
  email?: string
  assignedTickets?: number
  activeTicketsCount?: number
  highPriorityCount?: number
}

export interface TicketSummary {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  closedTickets?: number
  breachedSlaTickets?: number
  slaBreachedTickets?: number
  slaComplianceRate?: number
  averageResolutionTimeHours?: number
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
