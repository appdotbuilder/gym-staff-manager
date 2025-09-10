import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

export const getMembers = async (): Promise<Member[]> => {
  try {
    const result = await db.select()
      .from(membersTable)
      .execute();

    // Convert date strings to Date objects to match schema
    return result.map(member => ({
      ...member,
      date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : null,
      join_date: new Date(member.join_date),
      created_at: new Date(member.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};