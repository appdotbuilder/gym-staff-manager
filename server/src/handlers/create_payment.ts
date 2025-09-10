import { db } from '../db';
import { paymentsTable, membersTable, membershipsTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // Validate that the member exists
    const member = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();

    if (member.length === 0) {
      throw new Error(`Member with ID ${input.member_id} not found`);
    }

    // If membership_id is provided, validate that the membership exists and belongs to the member
    if (input.membership_id !== null && input.membership_id !== undefined) {
      const membership = await db.select()
        .from(membershipsTable)
        .where(eq(membershipsTable.id, input.membership_id))
        .execute();

      if (membership.length === 0) {
        throw new Error(`Membership with ID ${input.membership_id} not found`);
      }

      if (membership[0].member_id !== input.member_id) {
        throw new Error(`Membership ${input.membership_id} does not belong to member ${input.member_id}`);
      }
    }

    // Insert payment record
    const result = await db.insert(paymentsTable)
      .values({
        member_id: input.member_id,
        membership_id: input.membership_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        payment_method: input.payment_method,
        payment_date: input.payment_date ? input.payment_date.toISOString().split('T')[0] : undefined, // Convert Date to YYYY-MM-DD string
        description: input.description,
        status: input.status || 'completed'
      })
      .returning()
      .execute();

    // Convert numeric fields and dates back to expected types before returning
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount), // Convert string back to number
      payment_date: new Date(payment.payment_date), // Convert date string back to Date
      created_at: new Date(payment.created_at) // Ensure created_at is Date type
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};