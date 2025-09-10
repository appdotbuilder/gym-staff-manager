import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';
import { eq } from 'drizzle-orm';

export const getMember = async (id: number): Promise<Member> => {
  try {
    const result = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Member with id ${id} not found`);
    }

    const member = result[0];
    
    // Convert date strings to Date objects
    return {
      ...member,
      date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : null,
      join_date: new Date(member.join_date),
      created_at: new Date(member.created_at),
    };
  } catch (error) {
    console.error('Failed to get member:', error);
    throw error;
  }
};