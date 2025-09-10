import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean, 
  date,
  time,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'expired', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'bank_transfer', 'online']);
export const paymentStatusEnum = pgEnum('payment_status', ['completed', 'pending', 'failed', 'refunded']);

// Members table
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  date_of_birth: date('date_of_birth'),
  join_date: date('join_date').notNull().defaultNow(),
  emergency_contact_name: text('emergency_contact_name'),
  emergency_contact_phone: text('emergency_contact_phone'),
  medical_conditions: text('medical_conditions'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Member progress table
export const memberProgressTable = pgTable('member_progress', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull().references(() => membersTable.id, { onDelete: 'cascade' }),
  weight: numeric('weight', { precision: 5, scale: 2 }),
  body_fat_percentage: numeric('body_fat_percentage', { precision: 5, scale: 2 }),
  muscle_mass: numeric('muscle_mass', { precision: 5, scale: 2 }),
  notes: text('notes'),
  recorded_date: date('recorded_date').notNull().defaultNow(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Trainers table
export const trainersTable = pgTable('trainers', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  specialization: text('specialization'),
  hourly_rate: numeric('hourly_rate', { precision: 8, scale: 2 }),
  hire_date: date('hire_date').notNull().defaultNow(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Membership types table
export const membershipTypesTable = pgTable('membership_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration_months: integer('duration_months').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Memberships table
export const membershipsTable = pgTable('memberships', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull().references(() => membersTable.id, { onDelete: 'cascade' }),
  membership_type_id: integer('membership_type_id').notNull().references(() => membershipTypesTable.id),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  status: membershipStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  trainer_id: integer('trainer_id').notNull().references(() => trainersTable.id),
  max_capacity: integer('max_capacity').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  class_date: date('class_date').notNull(),
  start_time: time('start_time').notNull(),
  is_cancelled: boolean('is_cancelled').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Class attendance table
export const classAttendanceTable = pgTable('class_attendance', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classesTable.id, { onDelete: 'cascade' }),
  member_id: integer('member_id').notNull().references(() => membersTable.id, { onDelete: 'cascade' }),
  attended: boolean('attended').notNull(),
  check_in_time: timestamp('check_in_time'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull().references(() => membersTable.id, { onDelete: 'cascade' }),
  membership_id: integer('membership_id').references(() => membershipsTable.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  payment_date: date('payment_date').notNull().defaultNow(),
  description: text('description'),
  status: paymentStatusEnum('status').notNull().default('completed'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const membersRelations = relations(membersTable, ({ many }) => ({
  progress: many(memberProgressTable),
  memberships: many(membershipsTable),
  payments: many(paymentsTable),
  classAttendance: many(classAttendanceTable),
}));

export const memberProgressRelations = relations(memberProgressTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [memberProgressTable.member_id],
    references: [membersTable.id],
  }),
}));

export const trainersRelations = relations(trainersTable, ({ many }) => ({
  classes: many(classesTable),
}));

export const membershipTypesRelations = relations(membershipTypesTable, ({ many }) => ({
  memberships: many(membershipsTable),
}));

export const membershipsRelations = relations(membershipsTable, ({ one, many }) => ({
  member: one(membersTable, {
    fields: [membershipsTable.member_id],
    references: [membersTable.id],
  }),
  membershipType: one(membershipTypesTable, {
    fields: [membershipsTable.membership_type_id],
    references: [membershipTypesTable.id],
  }),
  payments: many(paymentsTable),
}));

export const classesRelations = relations(classesTable, ({ one, many }) => ({
  trainer: one(trainersTable, {
    fields: [classesTable.trainer_id],
    references: [trainersTable.id],
  }),
  attendance: many(classAttendanceTable),
}));

export const classAttendanceRelations = relations(classAttendanceTable, ({ one }) => ({
  class: one(classesTable, {
    fields: [classAttendanceTable.class_id],
    references: [classesTable.id],
  }),
  member: one(membersTable, {
    fields: [classAttendanceTable.member_id],
    references: [membersTable.id],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [paymentsTable.member_id],
    references: [membersTable.id],
  }),
  membership: one(membershipsTable, {
    fields: [paymentsTable.membership_id],
    references: [membershipsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;
export type MemberProgress = typeof memberProgressTable.$inferSelect;
export type NewMemberProgress = typeof memberProgressTable.$inferInsert;
export type Trainer = typeof trainersTable.$inferSelect;
export type NewTrainer = typeof trainersTable.$inferInsert;
export type MembershipType = typeof membershipTypesTable.$inferSelect;
export type NewMembershipType = typeof membershipTypesTable.$inferInsert;
export type Membership = typeof membershipsTable.$inferSelect;
export type NewMembership = typeof membershipsTable.$inferInsert;
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;
export type ClassAttendance = typeof classAttendanceTable.$inferSelect;
export type NewClassAttendance = typeof classAttendanceTable.$inferInsert;
export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  members: membersTable,
  memberProgress: memberProgressTable,
  trainers: trainersTable,
  membershipTypes: membershipTypesTable,
  memberships: membershipsTable,
  classes: classesTable,
  classAttendance: classAttendanceTable,
  payments: paymentsTable,
};