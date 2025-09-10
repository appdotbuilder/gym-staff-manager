import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentsTable, membersTable, membershipTypesTable, membershipsTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

// Test data setup
let testMember: any;
let testMembershipType: any;
let testMembership: any;

describe('createPayment', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test member first
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1234567890',
        date_of_birth: '1990-01-01', // Use string format for date column
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+0987654321',
        medical_conditions: 'None'
      })
      .returning()
      .execute();
    
    testMember = memberResult[0];

    // Create a test membership type
    const membershipTypeResult = await db.insert(membershipTypesTable)
      .values({
        name: 'Monthly',
        description: 'Monthly membership',
        duration_months: 1,
        price: '50.00'
      })
      .returning()
      .execute();
    
    testMembershipType = membershipTypeResult[0];

    // Create a test membership
    const today = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const membershipResult = await db.insert(membershipsTable)
      .values({
        member_id: testMember.id,
        membership_type_id: testMembershipType.id,
        start_date: today.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
        end_date: endDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
        status: 'active'
      })
      .returning()
      .execute();
    
    testMembership = membershipResult[0];
  });
  
  afterEach(resetDB);

  it('should create a payment with all fields', async () => {
    const testInput: CreatePaymentInput = {
      member_id: testMember.id,
      membership_id: testMembership.id,
      amount: 50.00,
      payment_method: 'card',
      payment_date: new Date('2024-01-15'),
      description: 'Monthly membership fee',
      status: 'completed'
    };

    const result = await createPayment(testInput);

    // Verify returned payment object
    expect(result.member_id).toEqual(testMember.id);
    expect(result.membership_id).toEqual(testMembership.id);
    expect(result.amount).toEqual(50.00);
    expect(typeof result.amount).toBe('number');
    expect(result.payment_method).toEqual('card');
    expect(result.payment_date).toBeInstanceOf(Date);
    expect(result.description).toEqual('Monthly membership fee');
    expect(result.status).toEqual('completed');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a payment with minimal required fields', async () => {
    const testInput: CreatePaymentInput = {
      member_id: testMember.id,
      membership_id: null,
      amount: 25.99,
      payment_method: 'cash',
      payment_date: undefined,
      description: null,
      status: undefined
    };

    const result = await createPayment(testInput);

    expect(result.member_id).toEqual(testMember.id);
    expect(result.membership_id).toBeNull();
    expect(result.amount).toEqual(25.99);
    expect(result.payment_method).toEqual('cash');
    expect(result.payment_date).toBeInstanceOf(Date);
    expect(result.description).toBeNull();
    expect(result.status).toEqual('completed'); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment to database correctly', async () => {
    const testInput: CreatePaymentInput = {
      member_id: testMember.id,
      membership_id: testMembership.id,
      amount: 75.50,
      payment_method: 'bank_transfer',
      payment_date: new Date('2024-02-10'),
      description: 'Personal training session',
      status: 'pending'
    };

    const result = await createPayment(testInput);

    // Query database to verify payment was saved
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].member_id).toEqual(testMember.id);
    expect(payments[0].membership_id).toEqual(testMembership.id);
    expect(parseFloat(payments[0].amount)).toEqual(75.50);
    expect(payments[0].payment_method).toEqual('bank_transfer');
    expect(payments[0].description).toEqual('Personal training session');
    expect(payments[0].status).toEqual('pending');
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different payment methods', async () => {
    const paymentMethods = ['cash', 'card', 'bank_transfer', 'online'] as const;
    
    for (const method of paymentMethods) {
      const testInput: CreatePaymentInput = {
        member_id: testMember.id,
        membership_id: null,
        amount: 30.00,
        payment_method: method,
        payment_date: new Date(),
        description: `Payment via ${method}`,
        status: 'completed'
      };

      const result = await createPayment(testInput);
      expect(result.payment_method).toEqual(method);
      expect(result.description).toEqual(`Payment via ${method}`);
    }
  });

  it('should handle different payment statuses', async () => {
    const statuses = ['completed', 'pending', 'failed', 'refunded'] as const;
    
    for (const status of statuses) {
      const testInput: CreatePaymentInput = {
        member_id: testMember.id,
        membership_id: null,
        amount: 40.00,
        payment_method: 'card',
        payment_date: new Date(),
        description: null,
        status: status
      };

      const result = await createPayment(testInput);
      expect(result.status).toEqual(status);
    }
  });

  it('should throw error when member does not exist', async () => {
    const testInput: CreatePaymentInput = {
      member_id: 99999, // Non-existent member ID
      membership_id: null,
      amount: 50.00,
      payment_method: 'cash',
      payment_date: new Date(),
      description: null,
      status: 'completed'
    };

    expect(createPayment(testInput)).rejects.toThrow(/Member with ID 99999 not found/i);
  });

  it('should throw error when membership does not exist', async () => {
    const testInput: CreatePaymentInput = {
      member_id: testMember.id,
      membership_id: 99999, // Non-existent membership ID
      amount: 50.00,
      payment_method: 'cash',
      payment_date: new Date(),
      description: null,
      status: 'completed'
    };

    expect(createPayment(testInput)).rejects.toThrow(/Membership with ID 99999 not found/i);
  });

  it('should throw error when membership does not belong to member', async () => {
    // Create another member
    const otherMemberResult = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@test.com',
        phone: '+1111111111',
        date_of_birth: '1985-05-15', // Use string format for date column
        emergency_contact_name: 'John Smith',
        emergency_contact_phone: '+2222222222',
        medical_conditions: 'Allergies'
      })
      .returning()
      .execute();

    const otherMember = otherMemberResult[0];

    const testInput: CreatePaymentInput = {
      member_id: otherMember.id,
      membership_id: testMembership.id, // This membership belongs to testMember, not otherMember
      amount: 50.00,
      payment_method: 'cash',
      payment_date: new Date(),
      description: null,
      status: 'completed'
    };

    expect(createPayment(testInput)).rejects.toThrow(/Membership .* does not belong to member/i);
  });

  it('should handle numeric precision correctly', async () => {
    const testInput: CreatePaymentInput = {
      member_id: testMember.id,
      membership_id: null,
      amount: 123.45,
      payment_method: 'card',
      payment_date: new Date(),
      description: 'Precision test',
      status: 'completed'
    };

    const result = await createPayment(testInput);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(parseFloat(payments[0].amount)).toEqual(123.45);
  });
});