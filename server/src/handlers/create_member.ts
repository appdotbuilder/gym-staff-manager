import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert member record
    const result = await db.insert(membersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        date_of_birth: input.date_of_birth ? input.date_of_birth.toISOString().split('T')[0] : null, // Convert Date to YYYY-MM-DD string
        emergency_contact_name: input.emergency_contact_name,
        emergency_contact_phone: input.emergency_contact_phone,
        medical_conditions: input.medical_conditions,
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects before returning
    const member = result[0];
    return {
      ...member,
      date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : null,
      join_date: new Date(member.join_date),
      created_at: new Date(member.created_at),
    };
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};