import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput, type Member } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMember = async (input: UpdateMemberInput): Promise<Member> => {
  try {
    // Check if member exists
    const existingMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.id))
      .limit(1)
      .execute();

    if (existingMember.length === 0) {
      throw new Error(`Member with id ${input.id} not found`);
    }

    // Create update object with only provided fields
    const updateData: any = {};
    
    if (input.first_name !== undefined) {
      updateData.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      updateData.last_name = input.last_name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.date_of_birth !== undefined) {
      updateData.date_of_birth = input.date_of_birth ? input.date_of_birth.toISOString().split('T')[0] : null;
    }
    if (input.emergency_contact_name !== undefined) {
      updateData.emergency_contact_name = input.emergency_contact_name;
    }
    if (input.emergency_contact_phone !== undefined) {
      updateData.emergency_contact_phone = input.emergency_contact_phone;
    }
    if (input.medical_conditions !== undefined) {
      updateData.medical_conditions = input.medical_conditions;
    }

    // Update member record
    const result = await db.update(membersTable)
      .set(updateData)
      .where(eq(membersTable.id, input.id))
      .returning()
      .execute();

    const member = result[0];
    
    // Convert date strings back to Date objects for consistency
    return {
      ...member,
      date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : null,
      join_date: new Date(member.join_date),
      created_at: new Date(member.created_at),
    };
  } catch (error) {
    console.error('Member update failed:', error);
    throw error;
  }
};