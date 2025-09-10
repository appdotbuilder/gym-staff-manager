import { db } from '../db';
import { membershipTypesTable } from '../db/schema';
import { type MembershipType } from '../schema';

export const getMembershipTypes = async (): Promise<MembershipType[]> => {
  try {
    // Fetch all membership types from the database
    const results = await db.select()
      .from(membershipTypesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(membershipType => ({
      ...membershipType,
      price: parseFloat(membershipType.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Membership types retrieval failed:', error);
    throw error;
  }
};