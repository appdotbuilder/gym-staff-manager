import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, paymentsTable, membershipsTable, membershipTypesTable } from '../db/schema';
import { type RevenueReportInput } from '../schema';
import { generateRevenueReport } from '../handlers/generate_revenue_report';

describe('generateRevenueReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestMember = async () => {
    const result = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        date_of_birth: '1990-01-01',
        join_date: '2024-01-01',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '555-0124',
        medical_conditions: null,
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestMembershipType = async () => {
    const result = await db.insert(membershipTypesTable)
      .values({
        name: 'Basic',
        description: 'Basic membership',
        duration_months: 1,
        price: '50.00',
        is_active: true,
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestMembership = async (memberId: number, membershipTypeId: number) => {
    const result = await db.insert(membershipsTable)
      .values({
        member_id: memberId,
        membership_type_id: membershipTypeId,
        start_date: '2024-01-01',
        end_date: '2024-02-01',
        status: 'active',
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should generate empty report for period with no payments', async () => {
    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.period_start).toEqual(input.period_start);
    expect(result.period_end).toEqual(input.period_end);
    expect(result.total_revenue).toEqual(0);
    expect(result.membership_revenue).toEqual(0);
    expect(result.other_revenue).toEqual(0);
    expect(result.payment_count).toEqual(0);
    expect(result.breakdown_by_method).toEqual({
      cash: 0,
      card: 0,
      bank_transfer: 0,
      online: 0,
    });
  });

  it('should calculate total revenue from completed payments', async () => {
    const member = await createTestMember();

    // Create payments with different amounts
    await db.insert(paymentsTable)
      .values([
        {
          member_id: member.id,
          membership_id: null,
          amount: '100.00',
          payment_method: 'cash',
          payment_date: '2024-01-15',
          description: 'Personal training',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '50.50',
          payment_method: 'card',
          payment_date: '2024-01-20',
          description: 'Protein shake',
          status: 'completed',
        },
      ])
      .execute();

    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.total_revenue).toEqual(150.50);
    expect(result.payment_count).toEqual(2);
    expect(typeof result.total_revenue).toBe('number');
  });

  it('should exclude non-completed payments from revenue calculation', async () => {
    const member = await createTestMember();

    await db.insert(paymentsTable)
      .values([
        {
          member_id: member.id,
          membership_id: null,
          amount: '100.00',
          payment_method: 'cash',
          payment_date: '2024-01-15',
          description: 'Completed payment',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '200.00',
          payment_method: 'card',
          payment_date: '2024-01-20',
          description: 'Pending payment',
          status: 'pending',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '150.00',
          payment_method: 'bank_transfer',
          payment_date: '2024-01-25',
          description: 'Failed payment',
          status: 'failed',
        },
      ])
      .execute();

    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.total_revenue).toEqual(100);
    expect(result.payment_count).toEqual(1);
  });

  it('should separate membership revenue from other revenue', async () => {
    const member = await createTestMember();
    const membershipType = await createTestMembershipType();
    const membership = await createTestMembership(member.id, membershipType.id);

    await db.insert(paymentsTable)
      .values([
        {
          member_id: member.id,
          membership_id: membership.id,
          amount: '50.00',
          payment_method: 'card',
          payment_date: '2024-01-15',
          description: 'Monthly membership',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '25.00',
          payment_method: 'cash',
          payment_date: '2024-01-20',
          description: 'Personal training',
          status: 'completed',
        },
      ])
      .execute();

    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.total_revenue).toEqual(75);
    expect(result.membership_revenue).toEqual(50);
    expect(result.other_revenue).toEqual(25);
    expect(result.payment_count).toEqual(2);
  });

  it('should create breakdown by payment method', async () => {
    const member = await createTestMember();

    await db.insert(paymentsTable)
      .values([
        {
          member_id: member.id,
          membership_id: null,
          amount: '100.00',
          payment_method: 'cash',
          payment_date: '2024-01-15',
          description: 'Cash payment',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '75.50',
          payment_method: 'card',
          payment_date: '2024-01-20',
          description: 'Card payment 1',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '25.25',
          payment_method: 'card',
          payment_date: '2024-01-22',
          description: 'Card payment 2',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '200.00',
          payment_method: 'bank_transfer',
          payment_date: '2024-01-25',
          description: 'Bank transfer',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '50.00',
          payment_method: 'online',
          payment_date: '2024-01-28',
          description: 'Online payment',
          status: 'completed',
        },
      ])
      .execute();

    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.breakdown_by_method).toEqual({
      cash: 100,
      card: 100.75, // 75.50 + 25.25
      bank_transfer: 200,
      online: 50,
    });
    expect(result.total_revenue).toEqual(450.75);
  });

  it('should filter payments by date range correctly', async () => {
    const member = await createTestMember();

    await db.insert(paymentsTable)
      .values([
        {
          member_id: member.id,
          membership_id: null,
          amount: '100.00',
          payment_method: 'cash',
          payment_date: '2023-12-31', // Before range
          description: 'Before range',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '50.00',
          payment_method: 'card',
          payment_date: '2024-01-01', // Start of range
          description: 'Start of range',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '75.00',
          payment_method: 'cash',
          payment_date: '2024-01-15', // Within range
          description: 'Within range',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '25.00',
          payment_method: 'online',
          payment_date: '2024-01-31', // End of range
          description: 'End of range',
          status: 'completed',
        },
        {
          member_id: member.id,
          membership_id: null,
          amount: '200.00',
          payment_method: 'bank_transfer',
          payment_date: '2024-02-01', // After range
          description: 'After range',
          status: 'completed',
        },
      ])
      .execute();

    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.total_revenue).toEqual(150); // 50 + 75 + 25
    expect(result.payment_count).toEqual(3);
    expect(result.breakdown_by_method['card']).toEqual(50); // 50 from start of range
    expect(result.breakdown_by_method['cash']).toEqual(75); // 75 from within range  
    expect(result.breakdown_by_method['online']).toEqual(25);
  });

  it('should handle comprehensive revenue scenario', async () => {
    const member1 = await createTestMember();
    const member2 = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-0456',
        date_of_birth: '1992-05-15',
        join_date: '2024-01-15',
        emergency_contact_name: 'Bob Smith',
        emergency_contact_phone: '555-0457',
        medical_conditions: null,
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const membershipType = await createTestMembershipType();
    const membership1 = await createTestMembership(member1.id, membershipType.id);
    const membership2 = await createTestMembership(member2.id, membershipType.id);

    // Mix of membership and other payments
    await db.insert(paymentsTable)
      .values([
        // Membership payments
        {
          member_id: member1.id,
          membership_id: membership1.id,
          amount: '50.00',
          payment_method: 'card',
          payment_date: '2024-01-10',
          description: 'Monthly membership',
          status: 'completed',
        },
        {
          member_id: member2.id,
          membership_id: membership2.id,
          amount: '50.00',
          payment_method: 'online',
          payment_date: '2024-01-15',
          description: 'Monthly membership',
          status: 'completed',
        },
        // Other payments
        {
          member_id: member1.id,
          membership_id: null,
          amount: '30.00',
          payment_method: 'cash',
          payment_date: '2024-01-20',
          description: 'Personal training',
          status: 'completed',
        },
        {
          member_id: member2.id,
          membership_id: null,
          amount: '15.50',
          payment_method: 'card',
          payment_date: '2024-01-25',
          description: 'Protein bar',
          status: 'completed',
        },
        // Non-completed payment (should be excluded)
        {
          member_id: member1.id,
          membership_id: null,
          amount: '100.00',
          payment_method: 'bank_transfer',
          payment_date: '2024-01-30',
          description: 'Pending payment',
          status: 'pending',
        },
      ])
      .execute();

    const input: RevenueReportInput = {
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-31'),
    };

    const result = await generateRevenueReport(input);

    expect(result.total_revenue).toEqual(145.50); // 50 + 50 + 30 + 15.50
    expect(result.membership_revenue).toEqual(100); // 50 + 50
    expect(result.other_revenue).toEqual(45.50); // 30 + 15.50
    expect(result.payment_count).toEqual(4);
    expect(result.breakdown_by_method).toEqual({
      cash: 30,
      card: 65.50, // 50 + 15.50
      bank_transfer: 0,
      online: 50,
    });
  });
});