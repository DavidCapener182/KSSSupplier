'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Bell, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [assignmentUpdates, setAssignmentUpdates] = useState(true);

  const handleSave = () => {
    // In Phase 2, this will save to Supabase
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been saved successfully.',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Settings' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input value={user?.email || ''} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Input value={user?.role || ''} disabled className="capitalize" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Profile information is managed by your administrator. Contact support to update your details.
            </p>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about upcoming events
                </p>
              </div>
              <input
                type="checkbox"
                checked={eventReminders}
                onChange={(e) => setEventReminders(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Assignment Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when assignments are updated
                </p>
              </div>
              <input
                type="checkbox"
                checked={assignmentUpdates}
                onChange={(e) => setAssignmentUpdates(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Platform details and version</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Platform</Label>
              <p className="font-medium">KSS NW UK Event Staffing Platform</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Version</Label>
              <p className="font-medium">1.0.0 (Phase 1 - Mock Data)</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Environment</Label>
              <p className="font-medium">Development</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data Storage</Label>
              <p className="font-medium">In-Memory (Mock Data)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


