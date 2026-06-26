import { z } from 'zod';

export const CustomerRequestSchema = z.object({
  receiptId: z.string().optional(),
  receiptNo: z.string().optional(),
  customerType: z.enum(['individual', 'company']).default('individual'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  tin: z.string().regex(/^[A-Z][0-9]{9,12}$/, 'TIN must start with a letter followed by 9-12 digits (e.g. C1234567890)'),
  idType: z.enum(['NRIC', 'PASSPORT', 'BRN']).default('NRIC'),
  idNumber: z.string().min(5, 'ID number is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
}).refine((d) => d.receiptId || d.receiptNo, {
  message: 'Either receiptId or receiptNo is required',
});

export const CsvRowSchema = z.object({
  receiptNo: z.string().min(1),
  outlet: z.string().default('Main Outlet'),
  channel: z.string().default('dine_in'),
  date: z.string().min(1),
  total: z.number().positive('Total must be positive'),
  subtotal: z.number().default(0),
  sst: z.number().default(0),
  serviceCharge: z.number().default(0),
  discount: z.number().default(0),
  rounding: z.number().default(0),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});
