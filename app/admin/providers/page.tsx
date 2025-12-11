'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Download, Users, FileText, Mail, Ban, CheckCircle, Plus, AlertCircle, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { exportAssignmentsToCSV, downloadCSV } from '@/lib/export';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import Link from 'next/link';
import { createProviderUser, toggleProviderAccess, deleteProviderUser } from '@/app/actions/provider-actions';
import { useToast } from '@/components/ui/use-toast';

export default function ProvidersPage() {
  const { 
    providers, 
    assignments, 
    events, 
    onboardingDocuments,
    loadEvents, 
    loadAssignments, 
    loadProviders, 
    loadAllOnboardingDocuments,
    isLoading 
  } = useDataStore();
  const { toast } = useToast();
  
  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
    loadAllOnboardingDocuments();
  }, [loadEvents, loadAssignments, loadProviders, loadAllOnboardingDocuments]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [activeTab, setActiveTab] = useState('active');

  // Add Provider State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    firstName: '',
    lastName: '',
    password: '', // Temporary password
  });
  const [manualPassword, setManualPassword] = useState(false);

  const providersWithStats = useMemo(() => {
    return providers.map((provider) => {
      const providerAssignments = assignments.filter((a) => a.provider_id === provider.id);
      const accepted = providerAssignments.filter((a) => a.status === 'accepted').length;
      const pending = providerAssignments.filter((a) => a.status === 'pending').length;
      const totalEvents = providerAssignments.length;

      // Check onboarding status
      const providerDocs = onboardingDocuments.filter(d => d.provider_id === provider.id);
      // Assume all docs in table are required, or filter if needed. For now use all.
      const docsCount = providerDocs.length;
      const signedDocsCount = providerDocs.filter(d => d.completed).length;
      
      const hasSignedAllDocs = docsCount > 0 && signedDocsCount === docsCount;
      // Legacy active: Approved but no documents exist at all
      const isLegacyActive = provider.status === 'approved' && docsCount === 0;
      
      // "Fully Onboarded" means either signed all docs OR is legacy active
      const isOnboarded = isLegacyActive || (provider.status === 'approved' && hasSignedAllDocs);

      // Calculate overall attendance rate
      const completedAssignments = providerAssignments.filter(
        (a) => a.status === 'accepted' && a.actual_managers !== null
      );
      let totalAssigned = 0;
      let totalActual = 0;
      completedAssignments.forEach((a) => {
        totalAssigned +=
          a.assigned_managers +
          a.assigned_supervisors +
          a.assigned_sia +
          a.assigned_stewards;
        totalActual +=
          (a.actual_managers || 0) +
          (a.actual_supervisors || 0) +
          (a.actual_sia || 0) +
          (a.actual_stewards || 0);
      });
      const attendanceRate =
        totalAssigned > 0 ? ((totalActual / totalAssigned) * 100).toFixed(1) : 'N/A';

      return {
        ...provider,
        totalEvents,
        accepted,
        pending,
        attendanceRate,
        isOnboarded,
        hasSignedAllDocs,
        isLegacyActive,
        docsCount
      };
    });
  }, [providers, assignments, onboardingDocuments]);

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let filtered = providersWithStats;

    // Filter by Tab
    if (activeTab === 'active') {
      // Active: Approved AND (Signed All Docs OR Legacy Active)
      filtered = filtered.filter(p => p.status === 'approved' && (p.hasSignedAllDocs || p.isLegacyActive));
    } else if (activeTab === 'awaiting_approval') {
      // Awaiting Approval: Pending AND Signed All Docs
      filtered = filtered.filter(p => p.status === 'pending' && p.hasSignedAllDocs);
    } else if (activeTab === 'pending_documents') {
      // Pending Documents: Not Suspended AND (Not Signed All Docs AND Not Legacy Active)
      // Includes:
      // - Pending status + No docs (needs to generate)
      // - Pending status + Docs exist but not all signed
      // - Approved status + Docs exist but not all signed (e.g. new doc added)
      filtered = filtered.filter(p => 
        p.status !== 'suspended' && 
        !p.hasSignedAllDocs && 
        !p.isLegacyActive
      );
    } else if (activeTab === 'suspended') {
      filtered = filtered.filter(p => p.status === 'suspended');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (provider) =>
          provider.company_name.toLowerCase().includes(query) ||
          provider.contact_email.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        case 'events':
          return b.totalEvents - a.totalEvents;
        case 'attendance':
          const rateA = a.attendanceRate === 'N/A' ? 0 : parseFloat(a.attendanceRate);
          const rateB = b.attendanceRate === 'N/A' ? 0 : parseFloat(b.attendanceRate);
          return rateB - rateA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [providersWithStats, searchQuery, sortBy, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, activeTab]);

  const generateTempPassword = (name: string) => {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '');
    const base = cleaned || 'TempPass';
    const year = new Date().getFullYear();
    return `${base}${year}`;
  };

  const handleCreateProvider = async () => {
    if (!formData.companyName || !formData.contactEmail || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createProviderUser(formData);
      
      if (result.success) {
        toast({
          title: "Provider Created",
          description: "The provider account has been created successfully.",
          variant: "success" // Assuming variant 'success' exists in your toast theme, otherwise default
        });
        setIsAddModalOpen(false);
        setFormData({
          companyName: '',
          contactEmail: '',
          firstName: '',
          lastName: '',
          password: '',
        });
        // Reload providers to see the new one
        loadProviders();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create provider.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAccess = async (providerId: string, userId: string, shouldDisable: boolean) => {
    try {
      const result = await toggleProviderAccess(providerId, userId, shouldDisable);
      if (result.success) {
        toast({
          title: shouldDisable ? "Provider Suspended" : "Provider Reinstated",
          description: shouldDisable 
            ? "The provider can no longer log in." 
            : "The provider's access has been restored.",
          variant: "default"
        });
        loadProviders();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update provider access.",
          variant: "destructive"
        });
      }
    } catch (error) {
       toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProvider = async (providerId: string, userId: string) => {
    try {
      const result = await deleteProviderUser(providerId, userId);
      if (result.success) {
        toast({
          title: "Provider Deleted",
          description: "The provider account has been permanently deleted.",
          variant: "default"
        });
        loadProviders();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete provider.",
          variant: "destructive"
        });
      }
    } catch (error) {
       toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Providers</h1>
          <p className="text-muted-foreground mt-2">Manage labour provider companies</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const csv = exportAssignmentsToCSV(assignments, events, providers);
                  downloadCSV(csv, `assignments-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                }}
                className="bg-background hover:bg-accent flex-shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Assignments</TooltipContent>
          </Tooltip>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="shiny" className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>Add New Provider</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new provider account. They will need these credentials to log in.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="companyName" className="text-right">
                    Company *
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => {
                      const companyName = e.target.value;
                      setFormData((prev) => {
                        const nextPassword = manualPassword ? prev.password : generateTempPassword(companyName);
                        return { ...prev, companyName, password: nextPassword };
                      });
                    }}
                    className="col-span-3 bg-background"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    className="col-span-3 bg-background"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="col-span-3 bg-background"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="col-span-3 bg-background"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Temp Password *
                  </Label>
                  <Input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => {
                      setManualPassword(true);
                      setFormData({...formData, password: e.target.value});
                    }}
                    className="col-span-3 bg-background"
                    placeholder="e.g. TempPass123!"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">
                    &nbsp;
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={!formData.contactEmail || !formData.password}
                      onClick={() => {
                        const subject = `Your KSS NW LTD Supplier Portal Access`;
                        const greeting = formData.firstName ? `Hi ${formData.firstName},` : 'Hello,';
                        const body = `${greeting}\n\nWelcome to the KSS NW LTD Supplier Portal.\n\nUsername: ${formData.contactEmail}\nTemp Password: ${formData.password}\n\nPlease log in and change your password on first login. You can manage events, messages, documents, and onboarding tasks in the portal.\n\nThanks,\nKSS NW LTD Team`;
                        const mailto = `mailto:${formData.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.location.href = mailto;
                      }}
                    >
                      Send via Email (opens draft)
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Opens your email client with a pre-filled welcome message including username and temp password.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProvider} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Provider'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 max-w-[800px]">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="awaiting_approval">Awaiting Approval</TabsTrigger>
          <TabsTrigger value="pending_documents">Pending Documents</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-md bg-card mt-4">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg font-semibold text-foreground">
              {activeTab === 'active' && 'Active Providers'}
              {activeTab === 'awaiting_approval' && 'Awaiting Approval'}
              {activeTab === 'pending_documents' && 'Pending Documents'}
              {activeTab === 'suspended' && 'Suspended Providers'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {activeTab === 'active' && 'List of all active labour providers'}
              {activeTab === 'awaiting_approval' && 'Providers waiting for admin approval'}
              {activeTab === 'pending_documents' && 'Providers who need to complete onboarding documents'}
              {activeTab === 'suspended' && 'List of providers with suspended access'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search providers by name or email..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="events">Total Events</SelectItem>
                      <SelectItem value="attendance">Attendance Rate</SelectItem>
                    </SelectContent>
                  </Select>
                  {searchQuery && (
                    <Button variant="ghost" onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-2 px-1">
                Showing {filteredProviders.length} of {providersWithStats.length} providers (in this status)
              </div>
            </div>
            <div className="block md:hidden space-y-4 p-4">
              {paginatedProviders.map((provider) => (
                <Card key={provider.id} className="p-4 border shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {provider.company_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/admin/providers/${provider.id}`} className="font-semibold text-lg hover:underline">
                            {provider.company_name}
                          </Link>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                            <Mail className="h-3 w-3" />
                            {provider.contact_email}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                      {provider.status === 'suspended' ? (
                         <Badge variant="destructive">Suspended</Badge>
                       ) : provider.isOnboarded ? (
                         <Link href={`/admin/providers/${provider.id}/onboarding`}>
                           <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/40 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer">Onboarded</Badge>
                         </Link>
                       ) : provider.status === 'pending' && provider.hasSignedAllDocs ? (
                         <Link href={`/admin/providers/${provider.id}/onboarding`}>
                           <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer">Awaiting</Badge>
                         </Link>
                       ) : (
                         <Link href={`/admin/providers/${provider.id}/onboarding`}>
                           <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer">Pending</Badge>
                         </Link>
                       )}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                      <div className="text-center">
                        <span className="text-muted-foreground block text-xs">Events</span>
                        <span className="font-medium">{provider.totalEvents}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-muted-foreground block text-xs">Accepted</span>
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-transparent">{provider.accepted}</Badge>
                      </div>
                      <div className="text-center">
                        <span className="text-muted-foreground block text-xs">Attendance</span>
                        {provider.attendanceRate === 'N/A' ? (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        ) : (
                          <span className={`font-bold ${parseFloat(provider.attendanceRate) >= 90 ? 'text-green-600 dark:text-green-400' : parseFloat(provider.attendanceRate) >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {provider.attendanceRate}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                       <Link href={`/admin/providers/${provider.id}`}>
                          <Button variant="outline" className="w-full h-8">View Details</Button>
                       </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="font-semibold text-foreground">Company Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Total Events</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Accepted</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Attendance Rate</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProviders.length > 0 ? (
                  paginatedProviders.map((provider) => (
                    <TableRow key={provider.id} className="hover:bg-muted/50 border-b border-border last:border-0">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {provider.company_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/providers/${provider.id}`}
                              className="text-foreground hover:text-primary hover:underline transition-colors block"
                            >
                              {provider.company_name}
                            </Link>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                              <Mail className="h-3 w-3" />
                              {provider.contact_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         {provider.status === 'suspended' ? (
                           <Badge variant="destructive">
                             Suspended
                           </Badge>
                         ) : provider.isOnboarded ? (
                           <Link href={`/admin/providers/${provider.id}/onboarding`}>
                             <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/40 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer">
                               Onboarded
                             </Badge>
                           </Link>
                         ) : provider.status === 'pending' && provider.hasSignedAllDocs ? (
                           <Link href={`/admin/providers/${provider.id}/onboarding`}>
                             <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer">
                               Awaiting Approval
                             </Badge>
                           </Link>
                         ) : (
                           <Link href={`/admin/providers/${provider.id}/onboarding`}>
                             <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer">
                               Pending Documents
                             </Badge>
                           </Link>
                         )}
                      </TableCell>
                      <TableCell className="text-center text-foreground font-medium">{provider.totalEvents}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-transparent">{provider.accepted}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {provider.attendanceRate === 'N/A' ? (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-bold ${parseFloat(provider.attendanceRate) >= 90 ? 'text-green-600 dark:text-green-400' : parseFloat(provider.attendanceRate) >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                              {provider.attendanceRate}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {activeTab === 'awaiting_approval' ? (
                            <Link href={`/admin/providers/pending?provider=${provider.id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </Link>
                          ) : null}

                          {/* Delete Button for Suspended/Pending */}
                          {activeTab !== 'active' && (
                             <Dialog>
                               <DialogTrigger asChild>
                                 <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                   <Trash className="h-4 w-4 mr-1" />
                                   Delete
                                 </Button>
                               </DialogTrigger>
                               <DialogContent>
                                 <DialogHeader>
                                   <DialogTitle>Delete Provider</DialogTitle>
                                   <DialogDescription>
                                     Are you sure you want to permanently delete {provider.company_name}? This action cannot be undone and will remove them from the portal and database.
                                   </DialogDescription>
                                 </DialogHeader>
                                 <DialogFooter>
                                   <Button variant="destructive" onClick={() => handleDeleteProvider(provider.id, provider.user_id)}>
                                     Confirm Delete
                                   </Button>
                                 </DialogFooter>
                               </DialogContent>
                             </Dialog>
                          )}
                          
                          {activeTab === 'active' ? (
                             <Dialog>
                               <DialogTrigger asChild>
                                 <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                   <Ban className="h-4 w-4 mr-1" />
                                   Suspend
                                 </Button>
                               </DialogTrigger>
                               <DialogContent>
                                 <DialogHeader>
                                   <DialogTitle>Suspend Provider Access</DialogTitle>
                                   <DialogDescription>
                                     Are you sure you want to suspend {provider.company_name}? They will no longer be able to log in to the portal.
                                   </DialogDescription>
                                 </DialogHeader>
                                 <DialogFooter>
                                   <Button variant="destructive" onClick={() => handleToggleAccess(provider.id, provider.user_id, true)}>
                                     Confirm Suspension
                                   </Button>
                                 </DialogFooter>
                               </DialogContent>
                             </Dialog>
                          ) : (
                             <Dialog>
                               <DialogTrigger asChild>
                                 <Button variant="ghost" size="sm" className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300">
                                   <CheckCircle className="h-4 w-4 mr-1" />
                                   Reinstate
                                 </Button>
                               </DialogTrigger>
                               <DialogContent>
                                 <DialogHeader>
                                   <DialogTitle>Reinstate Provider Access</DialogTitle>
                                   <DialogDescription>
                                     Are you sure you want to reinstate access for {provider.company_name}? They will be able to log in again.
                                   </DialogDescription>
                                 </DialogHeader>
                                 <DialogFooter>
                                   <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleToggleAccess(provider.id, provider.user_id, false)}>
                                     Confirm Reinstate
                                   </Button>
                                 </DialogFooter>
                               </DialogContent>
                             </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      <EmptyState
                        icon={activeTab === 'active' ? Users : Ban}
                        title={activeTab === 'active' ? "No Active Providers" : "No Suspended Providers"}
                        description={searchQuery
                          ? "No providers match your search criteria."
                          : activeTab === 'active' 
                            ? "No active providers found." 
                            : "No providers are currently suspended."}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
            <div className="p-4 border-t border-gray-100">
              {filteredProviders.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProviders.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
