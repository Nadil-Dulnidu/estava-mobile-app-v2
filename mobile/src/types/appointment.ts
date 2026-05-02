import { Property } from '@/src/types/property';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  _id: string;
  propertyId: string | Property;
  userId: string;
  agentId: string;
  appointmentDateTime: string;
  visitPurpose?: string | null;
  notes?: string | null;
  appointmentStatus: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}
