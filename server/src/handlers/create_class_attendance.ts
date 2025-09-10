import { db } from '../db';
import { classAttendanceTable, classesTable, membersTable } from '../db/schema';
import { type CreateClassAttendanceInput, type ClassAttendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createClassAttendance(input: CreateClassAttendanceInput): Promise<ClassAttendance> {
  try {
    // Validate that the class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .limit(1)
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with id ${input.class_id} does not exist`);
    }

    // Validate that the member exists
    const memberExists = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .limit(1)
      .execute();

    if (memberExists.length === 0) {
      throw new Error(`Member with id ${input.member_id} does not exist`);
    }

    // Check for duplicate attendance record
    const existingAttendance = await db.select()
      .from(classAttendanceTable)
      .where(
        and(
          eq(classAttendanceTable.class_id, input.class_id),
          eq(classAttendanceTable.member_id, input.member_id)
        )
      )
      .limit(1)
      .execute();

    if (existingAttendance.length > 0) {
      throw new Error(`Attendance record already exists for member ${input.member_id} in class ${input.class_id}`);
    }

    // Insert the new attendance record
    const result = await db.insert(classAttendanceTable)
      .values({
        class_id: input.class_id,
        member_id: input.member_id,
        attended: input.attended,
        check_in_time: input.check_in_time || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class attendance creation failed:', error);
    throw error;
  }
}