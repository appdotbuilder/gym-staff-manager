import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  UserCheck, 
  Plus,
  Activity
} from 'lucide-react';
import type { 
  Class, 
  Member,
  ClassAttendance, 
  CreateClassAttendanceInput,
  UpdateClassAttendanceInput
} from '../../../server/src/schema';

export function AttendanceManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [attendance, setAttendance] = useState<ClassAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [attendanceForm, setAttendanceForm] = useState<CreateClassAttendanceInput>({
    class_id: 0,
    member_id: 0,
    attended: true,
    check_in_time: null,
  });

  const loadData = useCallback(async () => {
    try {
      const [classesResult, membersResult] = await Promise.all([
        trpc.getClasses.query(),
        trpc.getMembers.query()
      ]);
      setClasses(classesResult);
      setMembers(membersResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  const loadClassAttendance = useCallback(async (classId: number) => {
    try {
      const result = await trpc.getClassAttendance.query({ class_id: classId });
      setAttendance(result);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedClass) {
      loadClassAttendance(selectedClass.id);
    }
  }, [selectedClass, loadClassAttendance]);

  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createClassAttendance.mutate(attendanceForm);
      setAttendance((prev: ClassAttendance[]) => [...prev, result]);
      setAttendanceForm({
        class_id: selectedClass?.id || 0,
        member_id: 0,
        attended: true,
        check_in_time: null,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create attendance record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAttendance = async (attendanceRecord: ClassAttendance, newAttendedStatus: boolean) => {
    setIsLoading(true);
    try {
      const updateData: UpdateClassAttendanceInput = {
        id: attendanceRecord.id,
        attended: newAttendedStatus,
        check_in_time: newAttendedStatus ? (attendanceRecord.check_in_time || new Date()) : null,
      };
      
      const result = await trpc.updateClassAttendance.mutate(updateData);
      setAttendance((prev: ClassAttendance[]) => 
        prev.map(record => record.id === result.id ? result : record)
      );
    } catch (error) {
      console.error('Failed to update attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const formatDateTime = (date: Date, time: string) => {
    const dateStr = new Date(date).toLocaleDateString();
    return `${dateStr} at ${time}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Not checked in';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown Member';
  };

  const getAttendanceStats = () => {
    if (!attendance.length) return { attended: 0, absent: 0, rate: 0 };
    const attended = attendance.filter(a => a.attended).length;
    const absent = attendance.length - attended;
    const rate = Math.round((attended / attendance.length) * 100);
    return { attended, absent, rate };
  };

  const getUnregisteredMembers = () => {
    const registeredMemberIds = attendance.map(a => a.member_id);
    return members.filter(m => !registeredMemberIds.includes(m.id));
  };

  // Filter classes to show recent and upcoming ones
  const recentAndUpcomingClasses = classes
    .filter(cls => {
      const classDate = new Date(cls.class_date);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return classDate >= threeDaysAgo && !cls.is_cancelled;
    })
    .sort((a, b) => new Date(b.class_date).getTime() - new Date(a.class_date).getTime());

  const stats = getAttendanceStats();
  const unregisteredMembers = getUnregisteredMembers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Attendance Tracking</h3>
          <p className="text-sm text-gray-600">Monitor class attendance and member check-ins</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Class
            </CardTitle>
            <CardDescription>Choose a class to view attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAndUpcomingClasses.length === 0 ? (
                <p className="text-gray-600 text-sm">No recent or upcoming classes</p>
              ) : (
                recentAndUpcomingClasses.slice(0, 5).map((cls: Class) => (
                  <Card 
                    key={cls.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedClass?.id === cls.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{cls.name}</h4>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(cls.class_date, cls.start_time)}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          Max {cls.max_capacity}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Attendance Stats
            </CardTitle>
            <CardDescription>
              {selectedClass ? selectedClass.name : 'No class selected'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedClass ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                    <div className="text-xs text-gray-600">Absent</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{stats.rate}%</div>
                  <div className="text-xs text-gray-600">Attendance Rate</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Capacity</span>
                    <span>{attendance.length} / {selectedClass.max_capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((attendance.length / selectedClass.max_capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Select a class to view stats</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Add attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedClass ? (
              <div className="space-y-3">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => setAttendanceForm(prev => ({ ...prev, class_id: selectedClass.id }))}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Attendance Record</DialogTitle>
                      <DialogDescription>
                        Mark a member as present or absent for {selectedClass.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAttendance} className="space-y-4">
                      <div>
                        <Label htmlFor="member_id">Member</Label>
                        <Select
                          value={attendanceForm.member_id ? attendanceForm.member_id.toString() : ''}
                          onValueChange={(value: string) =>
                            setAttendanceForm((prev: CreateClassAttendanceInput) => ({ 
                              ...prev, 
                              member_id: parseInt(value) 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {unregisteredMembers.map((member: Member) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.first_name} {member.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="attended"
                          checked={attendanceForm.attended}
                          onCheckedChange={(checked: boolean) =>
                            setAttendanceForm((prev: CreateClassAttendanceInput) => ({ 
                              ...prev, 
                              attended: checked,
                              check_in_time: checked ? new Date() : null
                            }))
                          }
                        />
                        <Label htmlFor="attended">
                          {attendanceForm.attended ? 'Present' : 'Absent'}
                        </Label>
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isLoading || !attendanceForm.member_id} 
                        className="w-full"
                      >
                        {isLoading ? 'Adding...' : 'Add Record'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                
                {unregisteredMembers.length === 0 && (
                  <p className="text-xs text-gray-600 text-center">
                    All members have attendance recorded
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Select a class first</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance List - {selectedClass.name}
            </CardTitle>
            <CardDescription>
              {formatDateTime(selectedClass.class_date, selectedClass.start_time)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No attendance records yet</p>
                <p className="text-sm text-gray-500">Add members to track their attendance</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((record: ClassAttendance) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${record.attended ? 'bg-green-100' : 'bg-red-100'}`}>
                        {record.attended ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{getMemberName(record.member_id)}</div>
                        <div className="text-sm text-gray-600">
                          Check-in: {formatTime(record.check_in_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.attended ? "default" : "secondary"}>
                        {record.attended ? 'Present' : 'Absent'}
                      </Badge>
                      <Switch
                        checked={record.attended}
                        onCheckedChange={(checked: boolean) => 
                          handleUpdateAttendance(record, checked)
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}