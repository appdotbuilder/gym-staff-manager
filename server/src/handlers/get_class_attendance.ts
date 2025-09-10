import { db } from '../db';
import { classAttendanceTable } from '../db/schema';
import { type ClassAttendance } from '../schema';
import { eq } from 'drizzle-orm';

export async function getClassAttendance(classId: number): Promise<ClassAttendance[]> {
  try {
    // Query attendance records for the specific class
    const results = await db.select()
      .from(classAttendanceTable)
      .where(eq(classAttendanceTable.class_id, classId))
      .execute();

    // Return the results directly - all fields match the schema
    return results;
  } catch (error) {
    console.error('Failed to get class attendance:', error);
    throw error;
  }
}