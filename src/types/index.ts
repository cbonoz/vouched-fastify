export interface Endorsement {
  id?: number;
  handle?: string;
  name?: string;
  relationship?: string;
  email?: string;
  message: string;
  createdAt: Date;
}
