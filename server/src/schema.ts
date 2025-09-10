import { z } from 'zod';

// Member schemas
export const memberSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  date_of_birth: z.coerce.date().nullable(),
  join_date: z.coerce.date(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  medical_conditions: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Member = z.infer<typeof memberSchema>;

export const createMemberInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  date_of_birth: z.coerce.date().nullable(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  medical_conditions: z.string().nullable(),
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const updateMemberInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  date_of_birth: z.coerce.date().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  medical_conditions: z.string().nullable().optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberInputSchema>;

// Member progress schemas
export const memberProgressSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  weight: z.number().nullable(),
  body_fat_percentage: z.number().nullable(),
  muscle_mass: z.number().nullable(),
  notes: z.string().nullable(),
  recorded_date: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type MemberProgress = z.infer<typeof memberProgressSchema>;

export const createMemberProgressInputSchema = z.object({
  member_id: z.number(),
  weight: z.number().positive().nullable(),
  body_fat_percentage: z.number().min(0).max(100).nullable(),
  muscle_mass: z.number().positive().nullable(),
  notes: z.string().nullable(),
  recorded_date: z.coerce.date().optional(),
});

export type CreateMemberProgressInput = z.infer<typeof createMemberProgressInputSchema>;

// Trainer schemas
export const trainerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  specialization: z.string().nullable(),
  hourly_rate: z.number().nullable(),
  hire_date: z.coerce.date(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
});

export type Trainer = z.infer<typeof trainerSchema>;

export const createTrainerInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  specialization: z.string().nullable(),
  hourly_rate: z.number().positive().nullable(),
});

export type CreateTrainerInput = z.infer<typeof createTrainerInputSchema>;

export const updateTrainerInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  hourly_rate: z.number().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateTrainerInput = z.infer<typeof updateTrainerInputSchema>;

// Membership type schemas
export const membershipTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  duration_months: z.number().int(),
  price: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
});

export type MembershipType = z.infer<typeof membershipTypeSchema>;

export const createMembershipTypeInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  duration_months: z.number().int().positive(),
  price: z.number().positive(),
});

export type CreateMembershipTypeInput = z.infer<typeof createMembershipTypeInputSchema>;

// Membership schemas
export const membershipSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  membership_type_id: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  status: z.enum(['active', 'expired', 'cancelled']),
  created_at: z.coerce.date(),
});

export type Membership = z.infer<typeof membershipSchema>;

export const createMembershipInputSchema = z.object({
  member_id: z.number(),
  membership_type_id: z.number(),
  start_date: z.coerce.date().optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipInputSchema>;

// Class schemas
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  trainer_id: z.number(),
  max_capacity: z.number().int(),
  duration_minutes: z.number().int(),
  class_date: z.coerce.date(),
  start_time: z.string(), // Time stored as string in HH:MM format
  is_cancelled: z.boolean(),
  created_at: z.coerce.date(),
});

export type Class = z.infer<typeof classSchema>;

export const createClassInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  trainer_id: z.number(),
  max_capacity: z.number().int().positive(),
  duration_minutes: z.number().int().positive(),
  class_date: z.coerce.date(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format validation
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  trainer_id: z.number().optional(),
  max_capacity: z.number().int().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
  class_date: z.coerce.date().optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  is_cancelled: z.boolean().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Class attendance schemas
export const classAttendanceSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  member_id: z.number(),
  attended: z.boolean(),
  check_in_time: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});

export type ClassAttendance = z.infer<typeof classAttendanceSchema>;

export const createClassAttendanceInputSchema = z.object({
  class_id: z.number(),
  member_id: z.number(),
  attended: z.boolean(),
  check_in_time: z.coerce.date().nullable(),
});

export type CreateClassAttendanceInput = z.infer<typeof createClassAttendanceInputSchema>;

export const updateClassAttendanceInputSchema = z.object({
  id: z.number(),
  attended: z.boolean(),
  check_in_time: z.coerce.date().nullable(),
});

export type UpdateClassAttendanceInput = z.infer<typeof updateClassAttendanceInputSchema>;

// Payment schemas
export const paymentSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  membership_id: z.number().nullable(),
  amount: z.number(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online']),
  payment_date: z.coerce.date(),
  description: z.string().nullable(),
  status: z.enum(['completed', 'pending', 'failed', 'refunded']),
  created_at: z.coerce.date(),
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z.object({
  member_id: z.number(),
  membership_id: z.number().nullable(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online']),
  payment_date: z.coerce.date().optional(),
  description: z.string().nullable(),
  status: z.enum(['completed', 'pending', 'failed', 'refunded']).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Revenue report schemas
export const revenueReportSchema = z.object({
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
  total_revenue: z.number(),
  membership_revenue: z.number(),
  other_revenue: z.number(),
  payment_count: z.number().int(),
  breakdown_by_method: z.record(z.string(), z.number()),
});

export type RevenueReport = z.infer<typeof revenueReportSchema>;

export const revenueReportInputSchema = z.object({
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
});

export type RevenueReportInput = z.infer<typeof revenueReportInputSchema>;

// Query parameter schemas
export const memberQuerySchema = z.object({
  id: z.number(),
});

export type MemberQuery = z.infer<typeof memberQuerySchema>;

export const classQuerySchema = z.object({
  id: z.number(),
});

export type ClassQuery = z.infer<typeof classQuerySchema>;

export const trainerQuerySchema = z.object({
  id: z.number(),
});

export type TrainerQuery = z.infer<typeof trainerQuerySchema>;

export const memberProgressQuerySchema = z.object({
  member_id: z.number(),
});

export type MemberProgressQuery = z.infer<typeof memberProgressQuerySchema>;

export const classAttendanceQuerySchema = z.object({
  class_id: z.number(),
});

export type ClassAttendanceQuery = z.infer<typeof classAttendanceQuerySchema>;