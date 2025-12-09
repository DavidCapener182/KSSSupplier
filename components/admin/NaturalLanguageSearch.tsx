import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Database, AlertCircle, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';

export function NaturalLanguageSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setSql('');

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/ai/natural-language-search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Search failed');

      setResults(data.results || []);
      setSql(data.sql);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) return;
    
    // Convert to CSV
    const headers = Object.keys(results[0]).join(',');
    const rows = results.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AI Super Search
          </CardTitle>
          <CardDescription>
            Ask questions about your data in plain English.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="e.g., Show providers near Manchester with >90% attendance"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
            <span className="font-medium">Try:</span>
            <button 
              onClick={() => setQuery("Show approved providers in London")}
              className="hover:text-blue-600 underline"
            >
              "Show approved providers in London"
            </button>
            <button 
              onClick={() => setQuery("List assignments for next month with status 'pending'")}
              className="hover:text-blue-600 underline"
            >
              "List pending assignments next month"
            </button>
            <button 
              onClick={() => setQuery("Count staff details by provider for Reading Festival")}
              className="hover:text-blue-600 underline"
            >
              "Count staff by provider for Reading Festival"
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sql && !error && (
        <div className="bg-slate-900 text-slate-300 p-3 rounded-md font-mono text-xs overflow-x-auto">
          <div className="flex items-center gap-2 mb-1 text-slate-500 uppercase font-bold text-[10px]">
            <Database className="h-3 w-3" /> Generated SQL
          </div>
          {sql}
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{results.length} Results</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(results[0]).map((key) => (
                      <TableHead key={key} className="whitespace-nowrap">{key.replace(/_/g, ' ')}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <TableCell key={j} className="whitespace-nowrap max-w-[300px] truncate">
                          {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && results.length === 0 && sql && (
        <div className="text-center py-10 text-gray-500">
          No results found for your query.
        </div>
      )}
    </div>
  );
}
