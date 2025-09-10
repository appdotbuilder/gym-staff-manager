import { db } from '../db';
import { memberProgressTable } from '../db/schema';
import { type MemberProgress } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getMemberProgress = async (memberId: number): Promise<MemberProgress[]> => {
  try {
    // Query progress records for the specific member, ordered by recorded_date (most recent first)
    const results = await db.select()
      .from(memberProgressTable)
      .where(eq(memberProgressTable.member_id, memberId))
      .orderBy(desc(memberProgressTable.recorded_date))
      .execute();

    // Convert numeric fields back to numbers and dates to Date objects before returning
    return results.map(progress => ({
      ...progress,
      weight: progress.weight ? parseFloat(progress.weight) : null,
      body_fat_percentage: progress.body_fat_percentage ? parseFloat(progress.body_fat_percentage) : null,
      muscle_mass: progress.muscle_mass ? parseFloat(progress.muscle_mass) : null,
      recorded_date: new Date(progress.recorded_date),
      created_at: new Date(progress.created_at),
    }));
  } catch (error) {
    console.error('Member progress retrieval failed:', error);
    throw error;
  }
};