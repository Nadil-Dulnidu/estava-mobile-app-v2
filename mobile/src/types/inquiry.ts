import { Property } from '@/src/types/property';

export type InquiryStatus = 'pending' | 'replied' | 'closed';

export interface Inquiry {
  _id: string;
  propertyId: string | Property;
  senderUserId: string;
  receiverUserId: string;
  subject?: string | null;
  message: string;
  contactNumber?: string | null;
  inquiryStatus: InquiryStatus;
  replyMessage?: string | null;
  repliedAt?: string | null;
  repliedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
