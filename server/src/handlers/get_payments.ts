import { db } from '../db';
import { paymentsTable } from '../db/schema';
import { type Payment } from '../schema';
import { desc } from 'drizzle-orm';

export async function getPayments(): Promise<Payment[]> {
  try {
    const results = await db.select()
      .from(paymentsTable)
      .orderBy(desc(paymentsTable.payment_date))
      .execute();

    // Convert numeric fields back to numbers and dates to Date objects
    return results.map(payment => ({
      ...payment,
      amount: parseFloat(payment.amount),
      payment_date: new Date(payment.payment_date),
      created_at: new Date(payment.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
}