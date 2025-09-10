import { db } from '../db';
import { classAttendanceTable } from '../db/schema';
import { type UpdateClassAttendanceInput, type ClassAttendance } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClassAttendance = async (input: UpdateClassAttendanceInput): Promise<ClassAttendance> => {
  try {
    // Update the class attendance record
    const result = await db.update(classAttendanceTable)
      .set({
        attended: input.attended,
        check_in_time: input.check_in_time || null,
      })
      .where(eq(classAttendanceTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Class attendance record with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Class attendance update failed:', error);
    throw error;
  }
};