import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  Users, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  UserPlus, 
  TrendingUp,
  Activity,

} from 'lucide-react';

// Import components
import { MembersManagement } from '@/components/MembersManagement';
import { TrainersManagement } from '@/components/TrainersManagement';
import { MembershipsManagement } from '@/components/MembershipsManagement';
import { ClassesManagement } from '@/components/ClassesManagement';
import { AttendanceManagement } from '@/components/AttendanceManagement';
import { PaymentsManagement } from '@/components/PaymentsManagement';
import { RevenueReports } from '@/components/RevenueReports';

function App() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FitTrack Pro 💪
              </h1>
              <p className="text-gray-600">Complete Gym Management System</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Trainers</span>
            </TabsTrigger>
            <TabsTrigger value="memberships" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Memberships</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Member Management
                </CardTitle>
                <CardDescription>
                  Add new members, update their information, and track their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MembersManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Trainer Management
                </CardTitle>
                <CardDescription>
                  Manage trainer profiles, specializations, and schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrainersManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memberships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Membership Management
                </CardTitle>
                <CardDescription>
                  Handle membership sign-ups, types, and renewals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MembershipsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Class Scheduling
                </CardTitle>
                <CardDescription>
                  Schedule fitness classes, manage capacity, and assign trainers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassesManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Attendance Tracking
                </CardTitle>
                <CardDescription>
                  Track class attendance and member check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Management
                </CardTitle>
                <CardDescription>
                  Record payments, track transactions, and manage billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Reports
                </CardTitle>
                <CardDescription>
                  Generate financial reports and analyze revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueReports />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;