'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export default function ProviderOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const {
    providers,
    getOnboardingDocuments,
    createOnboardingDocument,
    isProviderOnboarded,
    loadProviders,
    loadOnboardingDocuments,
  } = useDataStore();

  const provider = providers.find((p) => p.id === id);
  
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);
  
  useEffect(() => {
    if (provider) {
      loadOnboardingDocuments(provider.id);
    }
  }, [provider, loadOnboardingDocuments]);
  
  const documents = provider ? getOnboardingDocuments(provider.id) : [];
  const requiredDocs = documents.filter((d) => d.required);
  const completedCount = requiredDocs.filter((d) => d.completed).length;
  
  // Determine onboarded status consistent with providers list logic
  // isOnboarded = approved AND has signed all required docs (if any exist)
  const hasRequiredDocs = requiredDocs.length > 0;
  const hasSignedRequiredDocs = hasRequiredDocs && requiredDocs.every((d) => d.completed);
  const onboarded = provider ? (provider.status === 'approved' && hasSignedRequiredDocs) : false;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    document_type: 'contractor_agreement' as 'contractor_agreement' | 'nda',
    title: '',
    content: '',
    required: true,
  });

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Provider not found</p>
      </div>
    );
  }

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    createOnboardingDocument({
      provider_id: provider.id,
      document_type: formData.document_type,
      title: formData.title,
      content: formData.content,
      required: formData.required,
      completed: false,
    });

    toast({
      title: 'Document Created',
      description: 'The onboarding document has been created successfully.',
      variant: 'success',
    });

    setFormData({
      document_type: 'contractor_agreement',
      title: '',
      content: '',
      required: true,
    });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/providers" className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Providers
          </Link>
          <h1 className="text-3xl font-bold">Onboarding Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage onboarding documents for {provider.company_name}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Onboarding Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {onboarded ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Onboarded</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Pending</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedCount}/{requiredDocs.length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">Created</p>
          </CardContent>
        </Card>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Onboarding Document</CardTitle>
            <CardDescription>Add a new document for this provider to complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.document_type}
                onChange={(e) =>
                  setFormData({ ...formData, document_type: e.target.value as any })
                }
              >
                <option value="contractor_agreement">Contractor Agreement</option>
                <option value="nda">Non-Disclosure Agreement (NDA)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., KSS NW UK Contractor Agreement"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the full text of the document..."
                rows={10}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="required" className="text-sm font-normal cursor-pointer">
                Required (must be completed before access)
              </Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Create Document</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>
                        {doc.document_type === 'contractor_agreement'
                          ? 'Contractor Agreement'
                          : 'Non-Disclosure Agreement'}
                        {doc.required && (
                          <Badge variant="destructive" className="ml-2">
                            Required
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.completed ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-600">Completed</span>
                        {doc.completed_at && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(doc.completed_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-red-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Created: {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                  </p>
                  {doc.completed && doc.signature && (
                    <p className="text-sm text-gray-600">
                      Signed by: <span className="font-medium">{doc.signature}</span>
                    </p>
                  )}
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{doc.content}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No onboarding documents created yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

