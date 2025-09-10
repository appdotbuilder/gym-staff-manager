import { db } from '../db';
import { membershipTypesTable } from '../db/schema';
import { type CreateMembershipTypeInput, type MembershipType } from '../schema';

export const createMembershipType = async (input: CreateMembershipTypeInput): Promise<MembershipType> => {
  try {
    // Insert membership type record
    const result = await db.insert(membershipTypesTable)
      .values({
        name: input.name,
        description: input.description,
        duration_months: input.duration_months,
        price: input.price.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const membershipType = result[0];
    return {
      ...membershipType,
      price: parseFloat(membershipType.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Membership type creation failed:', error);
    throw error;
  }
};