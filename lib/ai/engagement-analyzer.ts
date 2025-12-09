import { ActivityLog, Message, Provider } from '@/lib/types';

export interface EngagementMetrics {
  timeToOpenHours: number;
  loginFrequencyDays: number;
  chatLatencyHours: number;
  engagementScore: number;
  lastLogin: string | null;
  totalLogins: number;
  totalMessages: number;
}

export function calculateEngagementScore(
  provider: Provider,
  logs: ActivityLog[],
  messages: Message[],
  assignments: any[]
): EngagementMetrics {
  // 1. Time-to-Open: How fast do they view a new assignment?
  // We look for 'assignment_viewed' logs for this provider after an assignment was created
  let totalOpenTimeMinutes = 0;
  let openCount = 0;

  const assignmentLogs = logs.filter(
    (log) => log.entity_type === 'assignment' && log.action === 'assignment_viewed' && log.user_id === provider.user_id
  );

  assignments.forEach((assignment) => {
    // Find the first view log after assignment creation
    const firstView = assignmentLogs
      .filter((log) => log.entity_id === assignment.id && new Date(log.created_at) > new Date(assignment.created_at || ''))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

    if (firstView && assignment.created_at) {
      const created = new Date(assignment.created_at).getTime();
      const viewed = new Date(firstView.created_at).getTime();
      const diffMinutes = (viewed - created) / (1000 * 60);
      
      // Filter out unreasonable times (e.g., < 0 or > 2 weeks)
      if (diffMinutes > 0 && diffMinutes < 20160) {
        totalOpenTimeMinutes += diffMinutes;
        openCount++;
      }
    }
  });

  const avgOpenTimeHours = openCount > 0 ? (totalOpenTimeMinutes / openCount) / 60 : 24; // Default to 24h if no data

  // 2. Login Frequency: Average days between logins
  // We look for any logs by this user to estimate activity sessions
  const userLogs = logs
    .filter((log) => log.user_id === provider.user_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let avgLoginDays = 7; // Default to weekly
  let totalLogins = 0;
  let lastLogin: string | null = null;

  if (userLogs.length > 0) {
    lastLogin = userLogs[userLogs.length - 1].created_at;
    
    // Group logs by day to count unique active days
    const activeDays = new Set<string>();
    userLogs.forEach(log => {
      activeDays.add(new Date(log.created_at).toISOString().split('T')[0]);
    });
    
    totalLogins = activeDays.size;

    if (totalLogins > 1) {
      const firstActive = new Date(userLogs[0].created_at).getTime();
      const lastActive = new Date(userLogs[userLogs.length - 1].created_at).getTime();
      const totalDays = (lastActive - firstActive) / (1000 * 60 * 60 * 24);
      
      avgLoginDays = totalDays / (totalLogins - 1); // Days per login
    } else {
      // If only 1 login ever, check how long ago it was
      const firstActive = new Date(userLogs[0].created_at).getTime();
      const now = Date.now();
      avgLoginDays = (now - firstActive) / (1000 * 60 * 60 * 24);
    }
  }

  // 3. Chat Latency: Time to reply to Admin
  // Sort messages by time
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let totalLatencyMinutes = 0;
  let replyCount = 0;

  for (let i = 0; i < sortedMessages.length - 1; i++) {
    const currentMsg = sortedMessages[i];
    const nextMsg = sortedMessages[i + 1];

    // Check pattern: Admin -> Provider
    // Assuming we can identify admin messages (sender_id != provider.user_id)
    if (currentMsg.receiver_id === provider.user_id && nextMsg.sender_id === provider.user_id) {
      const sent = new Date(currentMsg.created_at).getTime();
      const reply = new Date(nextMsg.created_at).getTime();
      const diffMinutes = (reply - sent) / (1000 * 60);

      // Filter out unreasonable times (< 0 or > 1 week)
      if (diffMinutes > 0 && diffMinutes < 10080) {
        totalLatencyMinutes += diffMinutes;
        replyCount++;
      }
    }
  }

  const avgLatencyHours = replyCount > 0 ? (totalLatencyMinutes / replyCount) / 60 : 4; // Default to 4h

  // 4. Calculate Engagement Score (0-100)
  // Higher is better

  // Time-to-Open Score: < 2h = 100, > 48h = 0
  const openScore = Math.max(0, Math.min(100, 100 - ((avgOpenTimeHours - 2) / 46) * 100));

  // Login Frequency Score: < 1 day = 100, > 14 days = 0
  const loginScore = Math.max(0, Math.min(100, 100 - ((avgLoginDays - 1) / 13) * 100));

  // Chat Latency Score: < 1h = 100, > 24h = 0
  const chatScore = Math.max(0, Math.min(100, 100 - ((avgLatencyHours - 1) / 23) * 100));

  // Weights
  // Login Frequency is heavily weighted as it shows proactive engagement
  const weightedScore = (openScore * 0.3) + (loginScore * 0.4) + (chatScore * 0.3);

  return {
    timeToOpenHours: avgOpenTimeHours,
    loginFrequencyDays: avgLoginDays,
    chatLatencyHours: avgLatencyHours,
    engagementScore: Math.round(weightedScore),
    lastLogin,
    totalLogins,
    totalMessages: messages.length
  };
}

