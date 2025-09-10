import { db } from '../db';
import { membershipsTable } from '../db/schema';
import { type Membership } from '../schema';

export const getMemberships = async (): Promise<Membership[]> => {
  try {
    const results = await db.select()
      .from(membershipsTable)
      .execute();

    // Return memberships with proper type conversion
    return results.map(membership => ({
      ...membership,
      // Convert date strings to Date objects for the schema
      start_date: new Date(membership.start_date),
      end_date: new Date(membership.end_date),
      created_at: membership.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch memberships:', error);
    throw error;
  }
};