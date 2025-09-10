import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  User,
  TrendingUp,
  Wallet,
  Receipt
} from 'lucide-react';
import type { 
  Payment, 
  Member,
  Membership,
  CreatePaymentInput 
} from '../../../server/src/schema';

export function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [paymentForm, setPaymentForm] = useState<CreatePaymentInput>({
    member_id: 0,
    membership_id: null,
    amount: 0,
    payment_method: 'cash',
    payment_date: new Date(),
    description: null,
    status: 'completed',
  });

  const loadData = useCallback(async () => {
    try {
      const [paymentsResult, membersResult, membershipsResult] = await Promise.all([
        trpc.getPayments.query(),
        trpc.getMembers.query(),
        trpc.getMemberships.query()
      ]);
      setPayments(paymentsResult);
      setMembers(membersResult);
      setMemberships(membershipsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createPayment.mutate(paymentForm);
      setPayments((prev: Payment[]) => [...prev, result]);
      setPaymentForm({
        member_id: 0,
        membership_id: null,
        amount: 0,
        payment_method: 'cash',
        payment_date: new Date(),
        description: null,
        status: 'completed',
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown Member';
  };

  const getMemberMemberships = (memberId: number) => {
    return memberships.filter(m => m.member_id === memberId && m.status === 'active');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-3 w-3" />;
      case 'card':
        return <CreditCard className="h-3 w-3" />;
      case 'bank_transfer':
        return <Receipt className="h-3 w-3" />;
      case 'online':
        return <CreditCard className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  // Calculate stats
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear() &&
           p.status === 'completed';
  });

  const thisMonthRevenue = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const recentPayments = payments
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment Management</h3>
          <p className="text-sm text-gray-600">Record and track member payments</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Add a payment record for a member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <Label htmlFor="member_id">Member</Label>
                <Select
                  value={paymentForm.member_id ? paymentForm.member_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      member_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member: Member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="membership_id">Related Membership (Optional)</Label>
                <Select
                  value={paymentForm.membership_id ? paymentForm.membership_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      membership_id: value && value !== '0' ? parseInt(value) : null 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No specific membership</SelectItem>
                    {(paymentForm.member_id && paymentForm.member_id > 0) ? getMemberMemberships(paymentForm.member_id).map((membership: Membership) => (
                      <SelectItem key={membership.id} value={membership.id.toString()}>
                        Membership #{membership.id}
                      </SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={paymentForm.payment_method}
                  onValueChange={(value: 'cash' | 'card' | 'bank_transfer' | 'online') =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      payment_method: value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentForm.payment_date ? new Date(paymentForm.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      payment_date: new Date(e.target.value) 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={paymentForm.status || 'completed'}
                  onValueChange={(value: 'completed' | 'pending' | 'failed' | 'refunded') =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      status: value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Payment description or notes..."
                  value={paymentForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setPaymentForm((prev: CreatePaymentInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading || !paymentForm.member_id || paymentForm.amount <= 0} 
                className="w-full"
              >
                {isLoading ? 'Recording...' : 'Record Payment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(thisMonthRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-purple-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {payments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {pendingPayments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Payments
          </CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No payments recorded yet</p>
              <p className="text-sm text-gray-500">Record your first payment to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment: Payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100">
                      {getPaymentMethodIcon(payment.payment_method)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {getMemberName(payment.member_id)}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(payment.payment_date)}
                        <span className="capitalize">• {payment.payment_method.replace('_', ' ')}</span>
                        {payment.membership_id && (
                          <span>• Membership #{payment.membership_id}</span>
                        )}
                      </div>
                      {payment.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {payment.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(payment.amount)}
                    </div>
                    <Badge className={getStatusBadgeColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Pending Payments
            </CardTitle>
            <CardDescription>Payments awaiting completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment: Payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{getMemberName(payment.member_id)}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(payment.payment_date)} • {payment.payment_method.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(payment.amount)}</div>
                    <Badge className={getStatusBadgeColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}