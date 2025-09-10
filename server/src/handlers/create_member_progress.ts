import { db } from '../db';
import { memberProgressTable, membersTable } from '../db/schema';
import { type CreateMemberProgressInput, type MemberProgress } from '../schema';
import { eq } from 'drizzle-orm';

export const createMemberProgress = async (input: CreateMemberProgressInput): Promise<MemberProgress> => {
  try {
    // First, validate that the member exists
    const existingMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();

    if (existingMember.length === 0) {
      throw new Error(`Member with ID ${input.member_id} not found`);
    }

    // Set recorded_date to current date if not provided
    const recordedDate = input.recorded_date || new Date();

    // Insert member progress record
    const result = await db.insert(memberProgressTable)
      .values({
        member_id: input.member_id,
        weight: input.weight ? input.weight.toString() : null, // Convert number to string for numeric column
        body_fat_percentage: input.body_fat_percentage ? input.body_fat_percentage.toString() : null,
        muscle_mass: input.muscle_mass ? input.muscle_mass.toString() : null,
        notes: input.notes,
        recorded_date: recordedDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const memberProgress = result[0];
    return {
      ...memberProgress,
      weight: memberProgress.weight ? parseFloat(memberProgress.weight) : null,
      body_fat_percentage: memberProgress.body_fat_percentage ? parseFloat(memberProgress.body_fat_percentage) : null,
      muscle_mass: memberProgress.muscle_mass ? parseFloat(memberProgress.muscle_mass) : null,
      recorded_date: new Date(memberProgress.recorded_date), // Convert string back to Date
    };
  } catch (error) {
    console.error('Member progress creation failed:', error);
    throw error;
  }
};