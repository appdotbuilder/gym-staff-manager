import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, paymentsTable, membershipsTable, membershipTypesTable } from '../db/schema';
import { getPayments } from '../handlers/get_payments';

describe('getPayments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no payments exist', async () => {
    const result = await getPayments();
    expect(result).toEqual([]);
  });

  it('should return all payments ordered by payment date descending', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      })
      .returning()
      .execute();

    const [membershipType] = await db.insert(membershipTypesTable)
      .values({
        name: 'Monthly',
        duration_months: 1,
        price: '50.00',
      })
      .returning()
      .execute();

    const [membership] = await db.insert(membershipsTable)
      .values({
        member_id: member.id,
        membership_type_id: membershipType.id,
        start_date: '2024-01-01',
        end_date: '2024-02-01',
      })
      .returning()
      .execute();

    // Create test payments with different dates
    const paymentData = [
      {
        member_id: member.id,
        membership_id: membership.id,
        amount: '100.50',
        payment_method: 'card' as const,
        payment_date: '2024-01-15',
        description: 'Monthly membership fee',
        status: 'completed' as const,
      },
      {
        member_id: member.id,
        membership_id: null,
        amount: '25.00',
        payment_method: 'cash' as const,
        payment_date: '2024-01-20',
        description: 'Personal training session',
        status: 'completed' as const,
      },
      {
        member_id: member.id,
        membership_id: membership.id,
        amount: '75.25',
        payment_method: 'bank_transfer' as const,
        payment_date: '2024-01-10',
        description: 'Membership renewal',
        status: 'pending' as const,
      },
    ];

    await db.insert(paymentsTable)
      .values(paymentData)
      .execute();

    const result = await getPayments();

    // Should return 3 payments
    expect(result).toHaveLength(3);

    // Should be ordered by payment_date descending (most recent first)
    expect(result[0].payment_date).toEqual(new Date('2024-01-20'));
    expect(result[1].payment_date).toEqual(new Date('2024-01-15'));
    expect(result[2].payment_date).toEqual(new Date('2024-01-10'));

    // Verify first payment details
    expect(result[0].member_id).toEqual(member.id);
    expect(result[0].membership_id).toBeNull();
    expect(result[0].amount).toEqual(25.00);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].payment_method).toEqual('cash');
    expect(result[0].description).toEqual('Personal training session');
    expect(result[0].status).toEqual('completed');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric amount conversion correctly', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      })
      .returning()
      .execute();

    // Create payment with precise decimal amount
    await db.insert(paymentsTable)
      .values({
        member_id: member.id,
        membership_id: null,
        amount: '99.99',
        payment_method: 'online',
        payment_date: '2024-01-15',
        status: 'completed',
      })
      .execute();

    const result = await getPayments();

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(99.99);
    expect(typeof result[0].amount).toBe('number');
  });

  it('should handle all payment methods and statuses correctly', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
      })
      .returning()
      .execute();

    // Create payments with all possible payment methods and statuses
    const paymentData = [
      {
        member_id: member.id,
        amount: '50.00',
        payment_method: 'cash' as const,
        payment_date: '2024-01-01',
        status: 'completed' as const,
      },
      {
        member_id: member.id,
        amount: '75.00',
        payment_method: 'card' as const,
        payment_date: '2024-01-02',
        status: 'pending' as const,
      },
      {
        member_id: member.id,
        amount: '100.00',
        payment_method: 'bank_transfer' as const,
        payment_date: '2024-01-03',
        status: 'failed' as const,
      },
      {
        member_id: member.id,
        amount: '25.00',
        payment_method: 'online' as const,
        payment_date: '2024-01-04',
        status: 'refunded' as const,
      },
    ];

    await db.insert(paymentsTable)
      .values(paymentData)
      .execute();

    const result = await getPayments();

    expect(result).toHaveLength(4);

    // Verify all payment methods are present
    const paymentMethods = result.map(p => p.payment_method);
    expect(paymentMethods).toContain('cash');
    expect(paymentMethods).toContain('card');
    expect(paymentMethods).toContain('bank_transfer');
    expect(paymentMethods).toContain('online');

    // Verify all payment statuses are present
    const paymentStatuses = result.map(p => p.status);
    expect(paymentStatuses).toContain('completed');
    expect(paymentStatuses).toContain('pending');
    expect(paymentStatuses).toContain('failed');
    expect(paymentStatuses).toContain('refunded');
  });

  it('should handle payments with null membership_id and description', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable)
      .values({
        first_name: 'Null',
        last_name: 'Test',
        email: 'null@example.com',
      })
      .returning()
      .execute();

    // Create payment with null optional fields
    await db.insert(paymentsTable)
      .values({
        member_id: member.id,
        membership_id: null,
        amount: '30.00',
        payment_method: 'cash',
        payment_date: '2024-01-15',
        description: null,
        status: 'completed',
      })
      .execute();

    const result = await getPayments();

    expect(result).toHaveLength(1);
    expect(result[0].membership_id).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].amount).toEqual(30.00);
  });
});