import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, TrendingUp, Calendar, User, Phone, Mail } from 'lucide-react';
import type { Member, CreateMemberInput, UpdateMemberInput, MemberProgress, CreateMemberProgressInput } from '../../../server/src/schema';

export function MembersManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [memberForm, setMemberForm] = useState<CreateMemberInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: null,
    date_of_birth: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_conditions: null,
  });

  const [editForm, setEditForm] = useState<UpdateMemberInput>({
    id: 0,
    first_name: '',
    last_name: '',
    email: '',
    phone: null,
    date_of_birth: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_conditions: null,
  });

  const [progressForm, setProgressForm] = useState<CreateMemberProgressInput>({
    member_id: 0,
    weight: null,
    body_fat_percentage: null,
    muscle_mass: null,
    notes: null,
  });

  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getMembers.query();
      setMembers(result);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, []);

  const loadMemberProgress = useCallback(async (memberId: number) => {
    try {
      const result = await trpc.getMemberProgress.query({ member_id: memberId });
      setMemberProgress(result);
    } catch (error) {
      console.error('Failed to load member progress:', error);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createMember.mutate(memberForm);
      setMembers((prev: Member[]) => [...prev, result]);
      setMemberForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: null,
        date_of_birth: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_conditions: null,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.updateMember.mutate(editForm);
      setMembers((prev: Member[]) => 
        prev.map(member => member.id === result.id ? result : member)
      );
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createMemberProgress.mutate(progressForm);
      setMemberProgress((prev: MemberProgress[]) => [...prev, result]);
      setProgressForm({
        member_id: selectedMember?.id || 0,
        weight: null,
        body_fat_percentage: null,
        muscle_mass: null,
        notes: null,
      });
      setIsProgressDialogOpen(false);
    } catch (error) {
      console.error('Failed to add progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditForm({
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      date_of_birth: member.date_of_birth,
      emergency_contact_name: member.emergency_contact_name,
      emergency_contact_phone: member.emergency_contact_phone,
      medical_conditions: member.medical_conditions,
    });
    setIsEditMode(true);
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    loadMemberProgress(member.id);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not provided';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Members ({members.length})</h3>
          <p className="text-sm text-gray-600">Manage gym members and track their progress</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Add a new gym member to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={memberForm.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMemberForm((prev: CreateMemberInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={memberForm.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMemberForm((prev: CreateMemberInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={memberForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberForm((prev: CreateMemberInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={memberForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberForm((prev: CreateMemberInput) => ({ ...prev, phone: e.target.value || null }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={memberForm.date_of_birth ? new Date(memberForm.date_of_birth).toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberForm((prev: CreateMemberInput) => ({ 
                      ...prev, 
                      date_of_birth: e.target.value ? new Date(e.target.value) : null 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={memberForm.emergency_contact_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberForm((prev: CreateMemberInput) => ({ 
                      ...prev, 
                      emergency_contact_name: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={memberForm.emergency_contact_phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberForm((prev: CreateMemberInput) => ({ 
                      ...prev, 
                      emergency_contact_phone: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea
                  id="medical_conditions"
                  value={memberForm.medical_conditions || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setMemberForm((prev: CreateMemberInput) => ({ 
                      ...prev, 
                      medical_conditions: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Member'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Member List</TabsTrigger>
          <TabsTrigger value="details">Member Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {members.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No members found. Add your first member!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member: Member) => (
                <Card key={member.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectMember(member)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{member.first_name} {member.last_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMember(member);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {member.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined: {formatDate(member.join_date)}
                      </div>
                      {member.medical_conditions && (
                        <Badge variant="outline" className="text-xs">
                          Medical Notes
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedMember ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedMember.first_name} {selectedMember.last_name}
                  </CardTitle>
                  <CardDescription>Member Details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-gray-600">{selectedMember.email}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-gray-600">{selectedMember.phone || 'Not provided'}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Date of Birth</Label>
                    <p className="text-sm text-gray-600">{formatDate(selectedMember.date_of_birth)}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Join Date</Label>
                    <p className="text-sm text-gray-600">{formatDate(selectedMember.join_date)}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Emergency Contact</Label>
                    <p className="text-sm text-gray-600">
                      {selectedMember.emergency_contact_name || 'Not provided'}
                      {selectedMember.emergency_contact_phone && ` - ${selectedMember.emergency_contact_phone}`}
                    </p>
                  </div>
                  {selectedMember.medical_conditions && (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Medical Conditions</Label>
                      <p className="text-sm text-gray-600">{selectedMember.medical_conditions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Progress Tracking
                      </CardTitle>
                      <CardDescription>Monitor member fitness progress</CardDescription>
                    </div>
                    <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setProgressForm(prev => ({ ...prev, member_id: selectedMember.id }))}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Progress
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Progress Entry</DialogTitle>
                          <DialogDescription>
                            Record new progress measurements for {selectedMember.first_name}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddProgress} className="space-y-4">
                          <div>
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.1"
                              value={progressForm.weight || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProgressForm((prev: CreateMemberProgressInput) => ({ 
                                  ...prev, 
                                  weight: parseFloat(e.target.value) || null 
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="body_fat_percentage">Body Fat (%)</Label>
                            <Input
                              id="body_fat_percentage"
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={progressForm.body_fat_percentage || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProgressForm((prev: CreateMemberProgressInput) => ({ 
                                  ...prev, 
                                  body_fat_percentage: parseFloat(e.target.value) || null 
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="muscle_mass">Muscle Mass (kg)</Label>
                            <Input
                              id="muscle_mass"
                              type="number"
                              step="0.1"
                              value={progressForm.muscle_mass || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProgressForm((prev: CreateMemberProgressInput) => ({ 
                                  ...prev, 
                                  muscle_mass: parseFloat(e.target.value) || null 
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={progressForm.notes || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setProgressForm((prev: CreateMemberProgressInput) => ({ 
                                  ...prev, 
                                  notes: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Adding...' : 'Add Progress'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {memberProgress.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No progress entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {memberProgress.map((progress: MemberProgress) => (
                        <div key={progress.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">
                              {formatDate(progress.recorded_date)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            {progress.weight && (
                              <div>
                                <span className="font-medium">Weight:</span> {progress.weight}kg
                              </div>
                            )}
                            {progress.body_fat_percentage && (
                              <div>
                                <span className="font-medium">Body Fat:</span> {progress.body_fat_percentage}%
                              </div>
                            )}
                            {progress.muscle_mass && (
                              <div>
                                <span className="font-medium">Muscle:</span> {progress.muscle_mass}kg
                              </div>
                            )}
                          </div>
                          {progress.notes && (
                            <p className="text-sm text-gray-600">{progress.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Select a member from the list to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      {isEditMode && (
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                Update member information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editForm.first_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev: UpdateMemberInput) => ({ ...prev, first_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editForm.last_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev: UpdateMemberInput) => ({ ...prev, last_name: e.target.value }))
                    }
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateMemberInput) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateMemberInput) => ({ ...prev, phone: e.target.value || null }))
                  }
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Update Member'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}