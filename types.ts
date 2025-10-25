

export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum ProjectType {
  NewConstruction = "New Construction",
  Renovation = "Renovation",
  Demolition = "Demolition",
  InteriorFitOut = "Interior Fit-Out",
}

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: number;
  name: string;
  role: string;
  avatarUrl: string;
  isClockedIn: boolean;
  hourlyRate: number;
  clockInTime?: Date;
  currentProjectId?: number;
}

export interface PunchListItem {
  id: number;
  text: string;
  isComplete: boolean;
  photos: ProjectPhoto[];
}

export interface ProjectPhoto {
  id: number;
  imageDataUrl?: string; // Stored in IndexedDB, not with project object
  description: string;
  dateAdded: Date;
}

export interface Project {
  id: number;
  name: string;
  address: string;
  type: ProjectType;
  status: 'In Progress' | 'Completed' | 'On Hold';
  startDate: Date;
  endDate: Date;
  budget: number;
  currentSpend: number;
  markupPercent: number;
  punchList: PunchListItem[];
  photos: ProjectPhoto[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number;
  assigneeId: number;
  dueDate: Date;
  status: TaskStatus;
}

export interface TimeLog {
  id: number;
  userId: number;
  projectId: number;
  clockIn: Date;
  clockOut?: Date;
  durationMs?: number;
  cost?: number;
  clockInLocation?: Location;
  clockOutLocation?: Location;
  clockInMapImage?: string;
  clockOutMapImage?: string;
  invoiceId?: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  lowStockThreshold?: number;
}

export interface InventoryOrderItem {
  type: 'inventory';
  itemId: number;
}

export interface ManualOrderItem {
  type: 'manual';
  id: number;
  name: string;
}

export type OrderListItem = InventoryOrderItem | ManualOrderItem;

export interface MaterialLog {
  id: number;
  projectId: number;
  inventoryItemId?: number;
  description: string;
  quantityUsed: number;
  unitCost: number;
  costAtTime: number; // This is total cost for this line item (quantity * unitCost)
  dateUsed: Date;
  invoiceId?: number;
  receiptPhotoId?: string; // Key for photo in IndexedDB
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  projectId: number;
  issueDate: Date;
  dueDate: Date;
  status: 'Draft' | 'Sent' | 'Paid' | 'Void';
  laborLineItems: InvoiceLineItem[];
  materialLineItems: InvoiceLineItem[];
  subtotal: number;
  markupAmount: number;
  totalAmount: number;
}


export interface Chat {
  sender: 'user' | 'model';
  message: string;
  image?: string; // base64 encoded image
  toolResponse?: any;
}