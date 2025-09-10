import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { Package, UserPlus, Calendar, DollarSign, Clock } from 'lucide-react';
import type { 
  Member, 
  MembershipType, 
  Membership, 
  CreateMembershipTypeInput, 
  CreateMembershipInput 
} from '../../../server/src/schema';

export function MembershipsManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);

  // Form states
  const [typeForm, setTypeForm] = useState<CreateMembershipTypeInput>({
    name: '',
    description: null,
    duration_months: 1,
    price: 0,
  });

  const [membershipForm, setMembershipForm] = useState<CreateMembershipInput>({
    member_id: 0,
    membership_type_id: 0,
    start_date: new Date(),
  });

  const loadData = useCallback(async () => {
    try {
      const [membersResult, typesResult, membershipsResult] = await Promise.all([
        trpc.getMembers.query(),
        trpc.getMembershipTypes.query(),
        trpc.getMemberships.query()
      ]);
      setMembers(membersResult);
      setMembershipTypes(typesResult);
      setMemberships(membershipsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMembershipType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createMembershipType.mutate(typeForm);
      setMembershipTypes((prev: MembershipType[]) => [...prev, result]);
      setTypeForm({
        name: '',
        description: null,
        duration_months: 1,
        price: 0,
      });
      setIsTypeDialogOpen(false);
    } catch (error) {
      console.error('Failed to create membership type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createMembership.mutate(membershipForm);
      setMemberships((prev: Membership[]) => [...prev, result]);
      setMembershipForm({
        member_id: 0,
        membership_type_id: 0,
        start_date: new Date(),
      });
      setIsMembershipDialogOpen(false);
    } catch (error) {
      console.error('Failed to create membership:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown Member';
  };

  const getMembershipTypeName = (typeId: number) => {
    const type = membershipTypes.find(t => t.id === typeId);
    return type ? type.name : 'Unknown Type';
  };

  const activeMemberships = memberships.filter(m => m.status === 'active');
  const expiredMemberships = memberships.filter(m => m.status === 'expired');
  const cancelledMemberships = memberships.filter(m => m.status === 'cancelled');
  const activeMembershipTypes = membershipTypes.filter(t => t.is_active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Membership Management</h3>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Active: {activeMemberships.length}</span>
            <span>Expired: {expiredMemberships.length}</span>
            <span>Types: {activeMembershipTypes.length}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Membership Type</DialogTitle>
                <DialogDescription>
                  Create a new membership plan type
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMembershipType} className="space-y-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Premium Monthly, Basic Annual"
                    value={typeForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTypeForm((prev: CreateMembershipTypeInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the membership benefits..."
                    value={typeForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setTypeForm((prev: CreateMembershipTypeInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration_months">Duration (Months)</Label>
                    <Input
                      id="duration_months"
                      type="number"
                      min="1"
                      value={typeForm.duration_months}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTypeForm((prev: CreateMembershipTypeInput) => ({ 
                          ...prev, 
                          duration_months: parseInt(e.target.value) || 1 
                        }))
                      }
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={typeForm.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTypeForm((prev: CreateMembershipTypeInput) => ({ 
                          ...prev, 
                          price: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create Membership Type'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isMembershipDialogOpen} onOpenChange={setIsMembershipDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Membership</DialogTitle>
                <DialogDescription>
                  Sign up a member for a membership plan
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMembership} className="space-y-4">
                <div>
                  <Label htmlFor="member_id">Select Member</Label>
                  <Select
                    value={membershipForm.member_id ? membershipForm.member_id.toString() : ''}
                    onValueChange={(value: string) =>
                      setMembershipForm((prev: CreateMembershipInput) => ({ 
                        ...prev, 
                        member_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member" />
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
                  <Label htmlFor="membership_type_id">Membership Plan</Label>
                  <Select
                    value={membershipForm.membership_type_id ? membershipForm.membership_type_id.toString() : ''}
                    onValueChange={(value: string) =>
                      setMembershipForm((prev: CreateMembershipInput) => ({ 
                        ...prev, 
                        membership_type_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMembershipTypes.map((type: MembershipType) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} - ${type.price} ({type.duration_months} months)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={membershipForm.start_date ? new Date(membershipForm.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMembershipForm((prev: CreateMembershipInput) => ({ 
                        ...prev, 
                        start_date: new Date(e.target.value) 
                      }))
                    }
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading || !membershipForm.member_id || !membershipForm.membership_type_id} 
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create Membership'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="memberships" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memberships">Active Memberships</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="types">Membership Types</TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-4">
          {activeMemberships.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No active memberships. Sign up members!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMemberships.map((membership: Membership) => (
                <Card key={membership.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {getMemberName(membership.member_id)}
                        </CardTitle>
                        <CardDescription>
                          {getMembershipTypeName(membership.membership_type_id)}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusBadgeColor(membership.status)}>
                        {membership.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Started: {formatDate(membership.start_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {formatDate(membership.end_date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Member ID: #{membership.member_id}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiredMemberships.map((membership: Membership) => (
              <Card key={membership.id} className="border-l-4 border-l-red-500 opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {getMemberName(membership.member_id)}
                      </CardTitle>
                      <CardDescription>
                        {getMembershipTypeName(membership.membership_type_id)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusBadgeColor(membership.status)}>
                      {membership.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {formatDate(membership.start_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expired: {formatDate(membership.end_date)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cancelledMemberships.map((membership: Membership) => (
              <Card key={membership.id} className="border-l-4 border-l-gray-500 opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {getMemberName(membership.member_id)}
                      </CardTitle>
                      <CardDescription>
                        {getMembershipTypeName(membership.membership_type_id)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusBadgeColor(membership.status)}>
                      {membership.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {formatDate(membership.start_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      End Date: {formatDate(membership.end_date)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          {membershipTypes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No membership types created yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {membershipTypes.map((type: MembershipType) => (
                <Card key={type.id} className={`border-l-4 ${type.is_active ? 'border-l-blue-500' : 'border-l-gray-400'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        {type.description && (
                          <CardDescription>{type.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${type.price}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {type.duration_months} month{type.duration_months > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        Monthly: ${(type.price / type.duration_months).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}