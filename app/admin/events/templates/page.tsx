'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Copy, Edit } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function EventTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    eventTemplates,
    createEventTemplate,
    updateEventTemplate,
    deleteEventTemplate,
    createEventFromTemplate,
    loadEventTemplates,
  } = useDataStore();
  
  useEffect(() => {
    loadEventTemplates();
  }, [loadEventTemplates]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUseTemplateOpen, setIsUseTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    managers: '0',
    supervisors: '0',
    sia: '0',
    stewards: '0',
  });
  const [useTemplateData, setUseTemplateData] = useState({
    name: '',
    date: '',
  });

  const handleCreate = async () => {
    await createEventTemplate({
      name: formData.name,
      location: formData.location,
      requirements: {
        managers: parseInt(formData.managers) || 0,
        supervisors: parseInt(formData.supervisors) || 0,
        sia: parseInt(formData.sia) || 0,
        stewards: parseInt(formData.stewards) || 0,
      },
    });
    toast({
      title: 'Template Created',
      description: 'Event template has been created successfully.',
      variant: 'success',
    });
    setIsCreateOpen(false);
    setFormData({ name: '', location: '', managers: '0', supervisors: '0', sia: '0', stewards: '0' });
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      deleteEventTemplate(selectedTemplate);
      toast({
        title: 'Template Deleted',
        description: 'Template has been deleted.',
        variant: 'default',
      });
      setIsDeleteOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleUseTemplate = async () => {
    if (selectedTemplate && useTemplateData.date) {
      try {
        const event = await createEventFromTemplate(
          selectedTemplate,
          useTemplateData.date,
          useTemplateData.name || undefined
        );
        toast({
          title: 'Event Created',
          description: 'Event has been created from template.',
          variant: 'success',
        });
        setIsUseTemplateOpen(false);
        setUseTemplateData({ name: '', date: '' });
        router.push(`/admin/events/${event.id}`);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create event from template.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/admin/events' },
          { label: 'Templates' },
        ]}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Event Templates</h1>
            <p className="text-gray-600 mt-1">Create reusable templates for recurring events</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Event Template</DialogTitle>
              <DialogDescription>Save a reusable template for similar events</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Festival Template"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Location (Optional)</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Venue X, London"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Staff Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Managers</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.managers}
                      onChange={(e) => setFormData({ ...formData, managers: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supervisors</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.supervisors}
                      onChange={(e) => setFormData({ ...formData, supervisors: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SIA Licensed</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.sia}
                      onChange={(e) => setFormData({ ...formData, sia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stewards</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stewards}
                      onChange={(e) => setFormData({ ...formData, stewards: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Templates</CardTitle>
          <CardDescription>Use templates to quickly create similar events</CardDescription>
        </CardHeader>
        <CardContent>
          {eventTemplates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Managers</TableHead>
                  <TableHead>Supervisors</TableHead>
                  <TableHead>SIA</TableHead>
                  <TableHead>Stewards</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.location || '-'}</TableCell>
                    <TableCell>{template.requirements.managers}</TableCell>
                    <TableCell>{template.requirements.supervisors}</TableCell>
                    <TableCell>{template.requirements.sia}</TableCell>
                    <TableCell>{template.requirements.stewards}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setUseTemplateData({ name: '', date: '' });
                            setIsUseTemplateOpen(true);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-8">No templates created yet</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUseTemplateOpen} onOpenChange={setIsUseTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Event from Template</DialogTitle>
            <DialogDescription>Enter event details to create a new event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                value={useTemplateData.name}
                onChange={(e) => setUseTemplateData({ ...useTemplateData, name: e.target.value })}
                placeholder="Leave empty to use template name"
              />
            </div>
            <div className="space-y-2">
              <Label>Event Date *</Label>
              <Input
                type="date"
                value={useTemplateData.date}
                onChange={(e) => setUseTemplateData({ ...useTemplateData, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUseTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} disabled={!useTemplateData.date}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

