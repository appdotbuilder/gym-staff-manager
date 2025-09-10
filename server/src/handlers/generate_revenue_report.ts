import { db } from '../db';
import { paymentsTable } from '../db/schema';
import { type RevenueReportInput, type RevenueReport } from '../schema';
import { gte, lte, and, eq, isNotNull, isNull } from 'drizzle-orm';

export async function generateRevenueReport(input: RevenueReportInput): Promise<RevenueReport> {
  try {
    // Base query for payments in the date range with completed status
    const baseConditions = [
      gte(paymentsTable.payment_date, input.period_start.toISOString().split('T')[0]),
      lte(paymentsTable.payment_date, input.period_end.toISOString().split('T')[0]),
      eq(paymentsTable.status, 'completed')
    ];

    // Get all completed payments in the date range
    const allPayments = await db.select()
      .from(paymentsTable)
      .where(and(...baseConditions))
      .execute();

    // Calculate total revenue
    const totalRevenue = allPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount);
    }, 0);

    // Separate membership revenue from other revenue
    const membershipRevenue = allPayments
      .filter(payment => payment.membership_id !== null)
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    const otherRevenue = allPayments
      .filter(payment => payment.membership_id === null)
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    // Count total payments
    const paymentCount = allPayments.length;

    // Calculate breakdown by payment method
    const breakdownByMethod = allPayments.reduce((breakdown, payment) => {
      const method = payment.payment_method;
      const amount = parseFloat(payment.amount);
      breakdown[method] = (breakdown[method] || 0) + amount;
      return breakdown;
    }, {} as Record<string, number>);

    // Ensure all payment methods are represented (even if 0)
    const completeBreakdown = {
      cash: breakdownByMethod['cash'] || 0,
      card: breakdownByMethod['card'] || 0,
      bank_transfer: breakdownByMethod['bank_transfer'] || 0,
      online: breakdownByMethod['online'] || 0,
    };

    return {
      period_start: input.period_start,
      period_end: input.period_end,
      total_revenue: totalRevenue,
      membership_revenue: membershipRevenue,
      other_revenue: otherRevenue,
      payment_count: paymentCount,
      breakdown_by_method: completeBreakdown,
    };
  } catch (error) {
    console.error('Revenue report generation failed:', error);
    throw error;
  }
}