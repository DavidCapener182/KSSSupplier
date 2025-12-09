'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, FileText, Plus, Minus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createEvent } = useDataStore();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    date: '',
    end_date: '',
    show_end_date: false,
    managers: '0',
    supervisors: '0',
    sia: '0',
    stewards: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Event date cannot be in the past';
      }

      if (formData.show_end_date && formData.end_date) {
        const endDate = new Date(formData.end_date);
        if (endDate < selectedDate) {
          newErrors.end_date = 'End date cannot be before start date';
        }
      }
    }

    const managers = parseInt(formData.managers) || 0;
    const supervisors = parseInt(formData.supervisors) || 0;
    const sia = parseInt(formData.sia) || 0;
    const stewards = parseInt(formData.stewards) || 0;

    if (managers < 0) newErrors.managers = 'Cannot be negative';
    if (supervisors < 0) newErrors.supervisors = 'Cannot be negative';
    if (sia < 0) newErrors.sia = 'Cannot be negative';
    if (stewards < 0) newErrors.stewards = 'Cannot be negative';

    if (managers + supervisors + sia + stewards === 0) {
      newErrors.requirements = 'At least one staff member is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    const newEvent = await createEvent({
      name: formData.name.trim(),
      location: formData.location.trim(),
      date: formData.date,
      end_date: formData.show_end_date ? formData.end_date : undefined,
      requirements: {
        managers: parseInt(formData.managers) || 0,
        supervisors: parseInt(formData.supervisors) || 0,
        sia: parseInt(formData.sia) || 0,
        stewards: parseInt(formData.stewards) || 0,
      },
    });
    toast({
      title: 'Event Created',
      description: `${formData.name} has been created successfully.`,
      variant: 'success',
    });
    router.push(`/admin/events/${newEvent.id}`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/admin/events' },
          { label: 'Create Event' },
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
            <h1 className="text-3xl font-bold">Create New Event</h1>
            <p className="text-gray-600 mt-1">Add a new event to the 2026 season</p>
          </div>
        </div>
        <Link href="/admin/events/templates">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Enter the information for the new event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Create new event form">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  required
                  placeholder="Festival ABC"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (errors.location) setErrors({ ...errors, location: '' });
                  }}
                  required
                  placeholder="Venue X, London"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="date">Event Date</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newValue = !formData.show_end_date;
                    setFormData({ 
                      ...formData, 
                      show_end_date: newValue,
                      end_date: newValue ? formData.date : '' 
                    });
                  }}
                  className="h-auto p-0 text-primary hover:text-primary/80"
                >
                  {formData.show_end_date ? (
                    <>
                      <Minus className="h-3 w-3 mr-1" />
                      Remove End Date
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Add End Date
                    </>
                  )}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      if (errors.date) setErrors({ ...errors, date: '' });
                    }}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.date ? 'border-red-500' : ''}
                  />
                  {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
                </div>
                {formData.show_end_date && (
                  <div className="space-y-2">
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => {
                        setFormData({ ...formData, end_date: e.target.value });
                        if (errors.end_date) setErrors({ ...errors, end_date: '' });
                      }}
                      required={formData.show_end_date}
                      min={formData.date || new Date().toISOString().split('T')[0]}
                      className={errors.end_date ? 'border-red-500' : ''}
                    />
                    {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Staff Requirements</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the number of staff required for each role</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {errors.requirements && (
                <p className="text-sm text-red-600">{errors.requirements}</p>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="managers">Managers</Label>
                  <Input
                    id="managers"
                    type="number"
                    min="0"
                    value={formData.managers}
                    onChange={(e) => {
                      setFormData({ ...formData, managers: e.target.value });
                      if (errors.managers) setErrors({ ...errors, managers: '' });
                      if (errors.requirements) setErrors({ ...errors, requirements: '' });
                    }}
                    required
                    className={errors.managers ? 'border-red-500' : ''}
                  />
                  {errors.managers && <p className="text-sm text-red-600">{errors.managers}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supervisors">Supervisors</Label>
                  <Input
                    id="supervisors"
                    type="number"
                    min="0"
                    value={formData.supervisors}
                    onChange={(e) => {
                      setFormData({ ...formData, supervisors: e.target.value });
                      if (errors.supervisors) setErrors({ ...errors, supervisors: '' });
                      if (errors.requirements) setErrors({ ...errors, requirements: '' });
                    }}
                    required
                    className={errors.supervisors ? 'border-red-500' : ''}
                  />
                  {errors.supervisors && <p className="text-sm text-red-600">{errors.supervisors}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sia">SIA Licensed</Label>
                  <Input
                    id="sia"
                    type="number"
                    min="0"
                    value={formData.sia}
                    onChange={(e) => {
                      setFormData({ ...formData, sia: e.target.value });
                      if (errors.sia) setErrors({ ...errors, sia: '' });
                      if (errors.requirements) setErrors({ ...errors, requirements: '' });
                    }}
                    required
                    className={errors.sia ? 'border-red-500' : ''}
                  />
                  {errors.sia && <p className="text-sm text-red-600">{errors.sia}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stewards">Stewards</Label>
                  <Input
                    id="stewards"
                    type="number"
                    min="0"
                    value={formData.stewards}
                    onChange={(e) => {
                      setFormData({ ...formData, stewards: e.target.value });
                      if (errors.stewards) setErrors({ ...errors, stewards: '' });
                      if (errors.requirements) setErrors({ ...errors, requirements: '' });
                    }}
                    required
                    className={errors.stewards ? 'border-red-500' : ''}
                  />
                  {errors.stewards && <p className="text-sm text-red-600">{errors.stewards}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/admin/events">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" aria-label="Create event">Create Event</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

