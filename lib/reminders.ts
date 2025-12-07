import type { Event, Assignment, Provider } from './types';

export interface EventReminder {
  id: string;
  event_id: string;
  assignment_id?: string;
  user_id: string;
  reminder_type: 'event_approaching' | 'event_tomorrow' | 'event_today' | 'staff_details_due';
  message: string;
  due_date: string;
  created_at: string;
  sent: boolean;
}

export function generateEventReminders(
  events: Event[],
  assignments: Assignment[],
  providers: Provider[]
): EventReminder[] {
  const reminders: EventReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Get assignments for this event
    const eventAssignments = assignments.filter((a) => a.event_id === event.id);

    eventAssignments.forEach((assignment) => {
      const provider = providers.find((p) => p.id === assignment.provider_id);
      if (!provider) return;

      // Reminder 7 days before event
      if (daysUntil === 7) {
        reminders.push({
          id: `reminder-${event.id}-${assignment.id}-7days`,
          event_id: event.id,
          assignment_id: assignment.id,
          user_id: provider.user_id,
          reminder_type: 'event_approaching',
          message: `Event "${event.name}" is approaching in 7 days. Please ensure all staff details are submitted.`,
          due_date: event.date,
          created_at: new Date().toISOString(),
          sent: false,
        });
      }

      // Reminder 1 day before event
      if (daysUntil === 1) {
        reminders.push({
          id: `reminder-${event.id}-${assignment.id}-1day`,
          event_id: event.id,
          assignment_id: assignment.id,
          user_id: provider.user_id,
          reminder_type: 'event_tomorrow',
          message: `Reminder: Event "${event.name}" is tomorrow. Please confirm all arrangements are in place.`,
          due_date: event.date,
          created_at: new Date().toISOString(),
          sent: false,
        });
      }

      // Reminder on event day
      if (daysUntil === 0) {
        reminders.push({
          id: `reminder-${event.id}-${assignment.id}-today`,
          event_id: event.id,
          assignment_id: assignment.id,
          user_id: provider.user_id,
          reminder_type: 'event_today',
          message: `Today is the event: "${event.name}". Good luck!`,
          due_date: event.date,
          created_at: new Date().toISOString(),
          sent: false,
        });
      }

      // Staff details reminder (if requested but not submitted)
      // Note: staffDetailsCount would need to be passed in or calculated
      if (assignment.details_requested && daysUntil > 0 && daysUntil <= 14) {
        reminders.push({
          id: `reminder-${event.id}-${assignment.id}-staff`,
          event_id: event.id,
          assignment_id: assignment.id,
          user_id: provider.user_id,
          reminder_type: 'staff_details_due',
          message: `Staff details are required for "${event.name}" (${daysUntil} days away). Please submit as soon as possible.`,
          due_date: event.date,
          created_at: new Date().toISOString(),
          sent: false,
        });
      }
    });
  });

  return reminders;
}

