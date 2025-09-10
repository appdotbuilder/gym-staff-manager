import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import type { 
  Class, 
  Trainer, 
  CreateClassInput, 
  UpdateClassInput 
} from '../../../server/src/schema';

export function ClassesManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [classForm, setClassForm] = useState<CreateClassInput>({
    name: '',
    description: null,
    trainer_id: 0,
    max_capacity: 10,
    duration_minutes: 60,
    class_date: new Date(),
    start_time: '09:00',
  });

  const [editForm, setEditForm] = useState<UpdateClassInput>({
    id: 0,
    name: '',
    description: null,
    trainer_id: 0,
    max_capacity: 10,
    duration_minutes: 60,
    class_date: new Date(),
    start_time: '09:00',
    is_cancelled: false,
  });

  const loadData = useCallback(async () => {
    try {
      const [classesResult, trainersResult] = await Promise.all([
        trpc.getClasses.query(),
        trpc.getTrainers.query()
      ]);
      setClasses(classesResult);
      setTrainers(trainersResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createClass.mutate(classForm);
      setClasses((prev: Class[]) => [...prev, result]);
      setClassForm({
        name: '',
        description: null,
        trainer_id: 0,
        max_capacity: 10,
        duration_minutes: 60,
        class_date: new Date(),
        start_time: '09:00',
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.updateClass.mutate(editForm);
      setClasses((prev: Class[]) => 
        prev.map(cls => cls.id === result.id ? result : cls)
      );
      setIsEditMode(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to update class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditForm({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      trainer_id: cls.trainer_id,
      max_capacity: cls.max_capacity,
      duration_minutes: cls.duration_minutes,
      class_date: cls.class_date,
      start_time: cls.start_time,
      is_cancelled: cls.is_cancelled,
    });
    setSelectedClass(cls);
    setIsEditMode(true);
  };



  const formatDateTime = (date: Date, time: string) => {
    const dateStr = new Date(date).toLocaleDateString();
    return `${dateStr} at ${time}`;
  };

  const getTrainerName = (trainerId: number) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? `${trainer.first_name} ${trainer.last_name}` : 'Unknown Trainer';
  };

  const getStatusBadgeColor = (cls: Class) => {
    if (cls.is_cancelled) return 'bg-red-100 text-red-700';
    const now = new Date();
    const classDate = new Date(cls.class_date);
    if (classDate < now) return 'bg-gray-100 text-gray-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = (cls: Class) => {
    if (cls.is_cancelled) return 'Cancelled';
    const now = new Date();
    const classDate = new Date(cls.class_date);
    if (classDate < now) return 'Completed';
    return 'Scheduled';
  };

  const activeTrainers = trainers.filter(t => t.is_active);
  const upcomingClasses = classes.filter(cls => !cls.is_cancelled && new Date(cls.class_date) >= new Date());
  const pastClasses = classes.filter(cls => !cls.is_cancelled && new Date(cls.class_date) < new Date());
  const cancelledClasses = classes.filter(cls => cls.is_cancelled);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Class Scheduling ({classes.length})</h3>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Upcoming: {upcomingClasses.length}</span>
            <span>Past: {pastClasses.length}</span>
            <span>Cancelled: {cancelledClasses.length}</span>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
              <DialogDescription>
                Create a new fitness class session
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Morning Yoga, HIIT Training"
                  value={classForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setClassForm((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the class..."
                  value={classForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setClassForm((prev: CreateClassInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="trainer_id">Trainer</Label>
                <Select
                  value={classForm.trainer_id ? classForm.trainer_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setClassForm((prev: CreateClassInput) => ({ 
                      ...prev, 
                      trainer_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTrainers.map((trainer: Trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id.toString()}>
                        {trainer.first_name} {trainer.last_name}
                        {trainer.specialization && ` - ${trainer.specialization}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_capacity">Max Capacity</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    min="1"
                    value={classForm.max_capacity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClassForm((prev: CreateClassInput) => ({ 
                        ...prev, 
                        max_capacity: parseInt(e.target.value) || 10 
                      }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration_minutes">Duration (min)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="15"
                    step="15"
                    value={classForm.duration_minutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClassForm((prev: CreateClassInput) => ({ 
                        ...prev, 
                        duration_minutes: parseInt(e.target.value) || 60 
                      }))
                    }
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class_date">Date</Label>
                  <Input
                    id="class_date"
                    type="date"
                    value={new Date(classForm.class_date).toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClassForm((prev: CreateClassInput) => ({ 
                        ...prev, 
                        class_date: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={classForm.start_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClassForm((prev: CreateClassInput) => ({ 
                        ...prev, 
                        start_time: e.target.value 
                      }))
                    }
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading || !classForm.trainer_id} 
                className="w-full"
              >
                {isLoading ? 'Scheduling...' : 'Schedule Class'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No classes scheduled yet. Create your first class!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Classes */}
          {upcomingClasses.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 text-green-700">Upcoming Classes</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingClasses.map((cls: Class) => (
                  <Card key={cls.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <CardDescription>
                            with {getTrainerName(cls.trainer_id)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={getStatusBadgeColor(cls)}>
                            {getStatusText(cls)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClass(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(cls.class_date, cls.start_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.duration_minutes} minutes
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Max {cls.max_capacity} participants
                        </div>
                        {cls.description && (
                          <p className="text-xs text-gray-600 mt-2">{cls.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Classes */}
          {pastClasses.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 text-gray-600">Past Classes</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastClasses.slice(0, 6).map((cls: Class) => (
                  <Card key={cls.id} className="border-l-4 border-l-gray-400 opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <CardDescription>
                            with {getTrainerName(cls.trainer_id)}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusBadgeColor(cls)}>
                          {getStatusText(cls)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(cls.class_date, cls.start_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.duration_minutes} minutes
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Max {cls.max_capacity} participants
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {pastClasses.length > 6 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  And {pastClasses.length - 6} more past classes...
                </p>
              )}
            </div>
          )}

          {/* Cancelled Classes */}
          {cancelledClasses.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Cancelled Classes
              </h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cancelledClasses.map((cls: Class) => (
                  <Card key={cls.id} className="border-l-4 border-l-red-500 opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <CardDescription>
                            with {getTrainerName(cls.trainer_id)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={getStatusBadgeColor(cls)}>
                            {getStatusText(cls)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClass(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(cls.class_date, cls.start_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.duration_minutes} minutes
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

      {/* Edit Class Dialog */}
      {isEditMode && selectedClass && (
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>
                Update class details and status
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Class Name</Label>
                <Input
                  id="edit_name"
                  value={editForm.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateClassInput) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit_trainer_id">Trainer</Label>
                <Select
                  value={editForm.trainer_id ? editForm.trainer_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setEditForm((prev: UpdateClassInput) => ({ 
                      ...prev, 
                      trainer_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTrainers.map((trainer: Trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id.toString()}>
                        {trainer.first_name} {trainer.last_name}
                        {trainer.specialization && ` - ${trainer.specialization}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_class_date">Date</Label>
                  <Input
                    id="edit_class_date"
                    type="date"
                    value={editForm.class_date ? new Date(editForm.class_date).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev: UpdateClassInput) => ({ 
                        ...prev, 
                        class_date: new Date(e.target.value) 
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_start_time">Time</Label>
                  <Input
                    id="edit_start_time"
                    type="time"
                    value={editForm.start_time || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev: UpdateClassInput) => ({ 
                        ...prev, 
                        start_time: e.target.value 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_cancelled"
                  checked={editForm.is_cancelled || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditForm((prev: UpdateClassInput) => ({ ...prev, is_cancelled: checked }))
                  }
                />
                <Label htmlFor="edit_is_cancelled">Cancelled</Label>
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Update Class'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}