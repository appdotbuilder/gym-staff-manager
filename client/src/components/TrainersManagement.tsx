import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, DollarSign, Calendar, UserCheck, Mail, Phone } from 'lucide-react';
import type { Trainer, CreateTrainerInput, UpdateTrainerInput } from '../../../server/src/schema';

export function TrainersManagement() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  // Form states
  const [trainerForm, setTrainerForm] = useState<CreateTrainerInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: null,
    specialization: null,
    hourly_rate: null,
  });

  const [editForm, setEditForm] = useState<UpdateTrainerInput>({
    id: 0,
    first_name: '',
    last_name: '',
    email: '',
    phone: null,
    specialization: null,
    hourly_rate: null,
    is_active: true,
  });

  const loadTrainers = useCallback(async () => {
    try {
      const result = await trpc.getTrainers.query();
      setTrainers(result);
    } catch (error) {
      console.error('Failed to load trainers:', error);
    }
  }, []);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createTrainer.mutate(trainerForm);
      setTrainers((prev: Trainer[]) => [...prev, result]);
      setTrainerForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: null,
        specialization: null,
        hourly_rate: null,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create trainer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.updateTrainer.mutate(editForm);
      setTrainers((prev: Trainer[]) => 
        prev.map(trainer => trainer.id === result.id ? result : trainer)
      );
      setIsEditMode(false);
      setSelectedTrainer(null);
    } catch (error) {
      console.error('Failed to update trainer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTrainer = (trainer: Trainer) => {
    setEditForm({
      id: trainer.id,
      first_name: trainer.first_name,
      last_name: trainer.last_name,
      email: trainer.email,
      phone: trainer.phone,
      specialization: trainer.specialization,
      hourly_rate: trainer.hourly_rate,
      is_active: trainer.is_active,
    });
    setSelectedTrainer(trainer);
    setIsEditMode(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const activeTrainers = trainers.filter(trainer => trainer.is_active);
  const inactiveTrainers = trainers.filter(trainer => !trainer.is_active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Trainers ({trainers.length})</h3>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Active: {activeTrainers.length}</span>
            <span>Inactive: {inactiveTrainers.length}</span>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Trainer</DialogTitle>
              <DialogDescription>
                Add a new fitness trainer to the team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTrainer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={trainerForm.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTrainerForm((prev: CreateTrainerInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={trainerForm.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTrainerForm((prev: CreateTrainerInput) => ({ ...prev, last_name: e.target.value }))
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
                  value={trainerForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrainerForm((prev: CreateTrainerInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={trainerForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrainerForm((prev: CreateTrainerInput) => ({ ...prev, phone: e.target.value || null }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Weight Training, Yoga, CrossFit"
                  value={trainerForm.specialization || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrainerForm((prev: CreateTrainerInput) => ({ ...prev, specialization: e.target.value || null }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={trainerForm.hourly_rate || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrainerForm((prev: CreateTrainerInput) => ({ 
                      ...prev, 
                      hourly_rate: parseFloat(e.target.value) || null 
                    }))
                  }
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Trainer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {trainers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No trainers found. Add your first trainer!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Trainers */}
          {activeTrainers.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 text-green-700">Active Trainers</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeTrainers.map((trainer: Trainer) => (
                  <Card key={trainer.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {trainer.first_name} {trainer.last_name}
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {trainer.email}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTrainer(trainer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {trainer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {trainer.phone}
                          </div>
                        )}
                        {trainer.specialization && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {trainer.specialization}
                          </div>
                        )}
                        {trainer.hourly_rate && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${trainer.hourly_rate}/hour
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Hired: {formatDate(trainer.hire_date)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Trainers */}
          {inactiveTrainers.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 text-gray-600">Inactive Trainers</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveTrainers.map((trainer: Trainer) => (
                  <Card key={trainer.id} className="border-l-4 border-l-gray-400 opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {trainer.first_name} {trainer.last_name}
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Inactive
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {trainer.email}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTrainer(trainer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {trainer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {trainer.phone}
                          </div>
                        )}
                        {trainer.specialization && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {trainer.specialization}
                          </div>
                        )}
                        {trainer.hourly_rate && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${trainer.hourly_rate}/hour
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Hired: {formatDate(trainer.hire_date)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Trainer Dialog */}
      {isEditMode && selectedTrainer && (
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Trainer</DialogTitle>
              <DialogDescription>
                Update trainer information and status
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTrainer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editForm.first_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev: UpdateTrainerInput) => ({ ...prev, first_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editForm.last_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev: UpdateTrainerInput) => ({ ...prev, last_name: e.target.value }))
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
                    setEditForm((prev: UpdateTrainerInput) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTrainerInput) => ({ ...prev, phone: e.target.value || null }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit_specialization">Specialization</Label>
                <Input
                  id="edit_specialization"
                  value={editForm.specialization || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTrainerInput) => ({ ...prev, specialization: e.target.value || null }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit_hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="edit_hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.hourly_rate || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTrainerInput) => ({ 
                      ...prev, 
                      hourly_rate: parseFloat(e.target.value) || null 
                    }))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={editForm.is_active || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditForm((prev: UpdateTrainerInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="edit_is_active">Active Status</Label>
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Update Trainer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}