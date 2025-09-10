import { db } from '../db';
import { membershipsTable, membersTable, membershipTypesTable } from '../db/schema';
import { type CreateMembershipInput, type Membership } from '../schema';
import { eq } from 'drizzle-orm';

export const createMembership = async (input: CreateMembershipInput): Promise<Membership> => {
  try {
    // Validate that the member exists
    const member = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();
    
    if (member.length === 0) {
      throw new Error(`Member with id ${input.member_id} not found`);
    }

    // Validate that the membership type exists and is active
    const membershipType = await db.select()
      .from(membershipTypesTable)
      .where(eq(membershipTypesTable.id, input.membership_type_id))
      .execute();
    
    if (membershipType.length === 0) {
      throw new Error(`Membership type with id ${input.membership_type_id} not found`);
    }

    if (!membershipType[0].is_active) {
      throw new Error(`Membership type with id ${input.membership_type_id} is not active`);
    }

    // Calculate start and end dates
    const startDate = input.start_date || new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + membershipType[0].duration_months);

    // Insert membership record
    const result = await db.insert(membershipsTable)
      .values({
        member_id: input.member_id,
        membership_type_id: input.membership_type_id,
        start_date: startDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        end_date: endDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        status: 'active'
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects
    const membership = result[0];
    return {
      ...membership,
      start_date: new Date(membership.start_date),
      end_date: new Date(membership.end_date),
      created_at: new Date(membership.created_at)
    };
  } catch (error) {
    console.error('Membership creation failed:', error);
    throw error;
  }
};