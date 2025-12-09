import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface RelationshipHealthAlertProps {
  score: number;
  riskFactor: number;
  recentTopics: string[];
}

export function RelationshipHealthAlert({ score, riskFactor, recentTopics }: RelationshipHealthAlertProps) {
  if (score > -0.3 && riskFactor < 50) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Relationship Risk Detected</AlertTitle>
      <AlertDescription>
        Sentiment analysis indicates potential friction. 
        Risk Factor: {riskFactor}/100.
        <div className="mt-2 text-xs">
          Recent topics: {recentTopics.join(', ')}
        </div>
      </AlertDescription>
    </Alert>
  );
}
