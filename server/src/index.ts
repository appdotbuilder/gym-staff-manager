import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createMemberInputSchema,
  updateMemberInputSchema,
  memberQuerySchema,
  createMemberProgressInputSchema,
  memberProgressQuerySchema,
  createTrainerInputSchema,
  updateTrainerInputSchema,
  trainerQuerySchema,
  createMembershipTypeInputSchema,
  createMembershipInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  classQuerySchema,
  createClassAttendanceInputSchema,
  updateClassAttendanceInputSchema,
  classAttendanceQuerySchema,
  createPaymentInputSchema,
  revenueReportInputSchema,
} from './schema';

// Import handlers
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { getMember } from './handlers/get_member';
import { updateMember } from './handlers/update_member';
import { createMemberProgress } from './handlers/create_member_progress';
import { getMemberProgress } from './handlers/get_member_progress';
import { createTrainer } from './handlers/create_trainer';
import { getTrainers } from './handlers/get_trainers';
import { getTrainer } from './handlers/get_trainer';
import { updateTrainer } from './handlers/update_trainer';
import { createMembershipType } from './handlers/create_membership_type';
import { getMembershipTypes } from './handlers/get_membership_types';
import { createMembership } from './handlers/create_membership';
import { getMemberships } from './handlers/get_memberships';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { getClass } from './handlers/get_class';
import { updateClass } from './handlers/update_class';
import { createClassAttendance } from './handlers/create_class_attendance';
import { getClassAttendance } from './handlers/get_class_attendance';
import { updateClassAttendance } from './handlers/update_class_attendance';
import { createPayment } from './handlers/create_payment';
import { getPayments } from './handlers/get_payments';
import { generateRevenueReport } from './handlers/generate_revenue_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Member management routes
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  
  getMembers: publicProcedure
    .query(() => getMembers()),
  
  getMember: publicProcedure
    .input(memberQuerySchema)
    .query(({ input }) => getMember(input.id)),
  
  updateMember: publicProcedure
    .input(updateMemberInputSchema)
    .mutation(({ input }) => updateMember(input)),

  // Member progress routes
  createMemberProgress: publicProcedure
    .input(createMemberProgressInputSchema)
    .mutation(({ input }) => createMemberProgress(input)),
  
  getMemberProgress: publicProcedure
    .input(memberProgressQuerySchema)
    .query(({ input }) => getMemberProgress(input.member_id)),

  // Trainer management routes
  createTrainer: publicProcedure
    .input(createTrainerInputSchema)
    .mutation(({ input }) => createTrainer(input)),
  
  getTrainers: publicProcedure
    .query(() => getTrainers()),
  
  getTrainer: publicProcedure
    .input(trainerQuerySchema)
    .query(({ input }) => getTrainer(input.id)),
  
  updateTrainer: publicProcedure
    .input(updateTrainerInputSchema)
    .mutation(({ input }) => updateTrainer(input)),

  // Membership type routes
  createMembershipType: publicProcedure
    .input(createMembershipTypeInputSchema)
    .mutation(({ input }) => createMembershipType(input)),
  
  getMembershipTypes: publicProcedure
    .query(() => getMembershipTypes()),

  // Membership routes
  createMembership: publicProcedure
    .input(createMembershipInputSchema)
    .mutation(({ input }) => createMembership(input)),
  
  getMemberships: publicProcedure
    .query(() => getMemberships()),

  // Class management routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  
  getClasses: publicProcedure
    .query(() => getClasses()),
  
  getClass: publicProcedure
    .input(classQuerySchema)
    .query(({ input }) => getClass(input.id)),
  
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),

  // Class attendance routes
  createClassAttendance: publicProcedure
    .input(createClassAttendanceInputSchema)
    .mutation(({ input }) => createClassAttendance(input)),
  
  getClassAttendance: publicProcedure
    .input(classAttendanceQuerySchema)
    .query(({ input }) => getClassAttendance(input.class_id)),
  
  updateClassAttendance: publicProcedure
    .input(updateClassAttendanceInputSchema)
    .mutation(({ input }) => updateClassAttendance(input)),

  // Payment routes
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),
  
  getPayments: publicProcedure
    .query(() => getPayments()),

  // Revenue reporting
  generateRevenueReport: publicProcedure
    .input(revenueReportInputSchema)
    .query(({ input }) => generateRevenueReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Gym Management server listening at port: ${port}`);
}

start();