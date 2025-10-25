// Core types for the ConstructTrack Pro backend

export interface Company {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: CompanySettings;
}

export interface CompanySettings {
  timezone: string;
  currency: string;
  defaultMarkupPercent: number;
  features: string[];
  maxUsers: number;
  maxProjects: number;
  storageGB: number;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Legacy fields for compatibility
  avatarUrl?: string;
  hourlyRate?: number;
  isClockedIn?: boolean;
  clockInTime?: Date;
  currentProjectId?: string;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  address: string;
  type: 'New Construction' | 'Renovation' | 'Demolition' | 'Interior Fit-Out';
  status: 'In Progress' | 'Completed' | 'On Hold';
  startDate: Date;
  endDate: Date;
  budget: number;
  currentSpend: number;
  markupPercent: number;
  createdAt: Date;
  updatedAt: Date;
  punchList: PunchListItem[];
  photos: ProjectPhoto[];
}

export interface PunchListItem {
  id: string;
  projectId: string;
  text: string;
  isComplete: boolean;
  photos: ProjectPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPhoto {
  id: string;
  projectId?: string;
  punchListItemId?: string;
  description: string;
  imageUrl: string;
  imageKey: string; // S3 key
  dateAdded: Date;
  createdAt: Date;
}

export interface Task {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: Date;
  status: 'To Do' | 'In Progress' | 'Done';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLog {
  id: string;
  companyId: string;
  userId: string;
  projectId: string;
  clockIn: Date;
  clockOut?: Date;
  durationMs?: number;
  cost?: number;
  clockInLocation?: Location;
  clockOutLocation?: Location;
  clockInMapImage?: string;
  clockOutMapImage?: string;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialLog {
  id: string;
  companyId: string;
  projectId: string;
  inventoryItemId?: string;
  description: string;
  quantityUsed: number;
  unitCost: number;
  costAtTime: number;
  dateUsed: Date;
  invoiceId?: string;
  receiptPhotoId?: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  companyId: string;
  projectId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: 'Draft' | 'Sent' | 'Paid' | 'Void';
  laborLineItems: InvoiceLineItem[];
  materialLineItems: InvoiceLineItem[];
  subtotal: number;
  markupAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  companyName: string;
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  company: Company;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    maxUsers: number;
    maxProjects: number;
    storageGB: number;
  };
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}
