import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3,
  PieChart,
  CreditCard,
  Download
} from 'lucide-react';
import type { RevenueReport, RevenueReportInput } from '../../../server/src/schema';

export function RevenueReports() {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [reportForm, setReportForm] = useState<RevenueReportInput>({
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    period_end: new Date(), // Today
  });

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.generateRevenueReport.query(reportForm);
      setReport(result);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reportForm]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getPaymentMethodDisplayName = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Credit/Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'online':
        return 'Online Payment';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
    }
  };

  const getQuickDateRanges = () => [
    {
      label: 'This Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
    {
      label: 'Last Month', 
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    },
    {
      label: 'Last 3 Months',
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1),
      end: new Date(),
    },
    {
      label: 'This Year',
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    },
  ];

  const setQuickDateRange = (start: Date, end: Date) => {
    setReportForm({
      period_start: start,
      period_end: end,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Revenue Reports 📊</h3>
          <p className="text-sm text-gray-600">Generate and analyze financial performance</p>
        </div>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate Revenue Report
          </CardTitle>
          <CardDescription>Select a date range to analyze revenue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Date Range Buttons */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Ranges</Label>
            <div className="flex flex-wrap gap-2">
              {getQuickDateRanges().map((range, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(range.start, range.end)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_start">Start Date</Label>
              <Input
                id="period_start"
                type="date"
                value={new Date(reportForm.period_start).toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReportForm((prev: RevenueReportInput) => ({ 
                    ...prev, 
                    period_start: new Date(e.target.value) 
                  }))
                }
              />
            </div>
            
            <div>
              <Label htmlFor="period_end">End Date</Label>
              <Input
                id="period_end"
                type="date"
                value={new Date(reportForm.period_end).toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReportForm((prev: RevenueReportInput) => ({ 
                    ...prev, 
                    period_end: new Date(e.target.value) 
                  }))
                }
              />
            </div>
          </div>
          
          <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <BarChart3 className="h-4 w-4 mr-2 animate-pulse" />
                Generating Report...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Revenue Report</h3>
                <p className="text-gray-600">
                  {formatDate(report.period_start)} - {formatDate(report.period_end)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(report.total_revenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Membership Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(report.membership_revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(report.membership_revenue, report.total_revenue)} of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Other Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(report.other_revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(report.other_revenue, report.total_revenue)} of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {report.payment_count}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {report.payment_count > 0 ? formatCurrency(report.total_revenue / report.payment_count) : '$0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method Breakdown
              </CardTitle>
              <CardDescription>Revenue distribution by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(report.breakdown_by_method).length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No payment data available for this period
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(report.breakdown_by_method)
                    .sort(([, a], [, b]) => b - a) // Sort by value descending
                    .map(([method, amount]) => (
                      <div key={method} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {getPaymentMethodDisplayName(method)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(amount)}</div>
                            <Badge variant="secondary" className="text-xs">
                              {formatPercentage(amount, report.total_revenue)}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${report.total_revenue > 0 ? (amount / report.total_revenue) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Revenue Composition</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Membership Revenue:</span>
                      <span className="font-medium">
                        {formatPercentage(report.membership_revenue, report.total_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Revenue:</span>
                      <span className="font-medium">
                        {formatPercentage(report.other_revenue, report.total_revenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Payment Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Payment:</span>
                      <span className="font-medium">
                        {report.payment_count > 0 
                          ? formatCurrency(report.total_revenue / report.payment_count)
                          : '$0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Transactions:</span>
                      <span className="font-medium">{report.payment_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="text-center">
            <Button variant="outline" className="w-fit">
              <Download className="h-4 w-4 mr-2" />
              Export Report (Coming Soon)
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!report && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generate Your First Report</h3>
            <p className="text-gray-600 mb-4">
              Select a date range above and click "Generate Report" to view revenue analytics
            </p>
            <div className="text-sm text-gray-500">
              📈 Track revenue trends • 💳 Analyze payment methods • 📊 Monitor performance
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}