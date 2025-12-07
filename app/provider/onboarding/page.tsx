'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { FileText, CheckCircle, XCircle, AlertCircle, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { generateNDAAgreement } from '@/lib/agreement-template';
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
import { generateContractorAgreement } from '@/lib/agreement-template';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const {
    providers,
    getOnboardingDocuments,
    completeOnboardingDocument,
    isProviderOnboarded,
    updateProviderDetails,
    loadProviders,
    loadOnboardingDocuments,
    createOnboardingDocument,
    onboardingDocuments, // Subscribe to store updates
  } = useDataStore();

  const provider = providers.find((p) => p.user_id === user?.id);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);
  const { logout } = useAuth();
  
  const handleSignOut = async () => {
    await logout();
    // router.push('/login'); // logout already handles redirect
  };
  
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);
  
  useEffect(() => {
    const load = async () => {
      if (provider) {
        await loadOnboardingDocuments(provider.id);
        setHasLoadedDocs(true);
      }
    };
    load();
  }, [provider, loadOnboardingDocuments]);
  
  // Use store data directly for reactivity
  const documents = provider ? onboardingDocuments.filter(d => d.provider_id === provider.id) : [];

  // Automatically generate default documents if none exist
  useEffect(() => {
    const generateDefaults = async () => {
      // Only generate if we have finished loading, we have a provider, AND no documents exist in store
      if (hasLoadedDocs && provider && documents.length === 0) {
        // Double check against store to prevent race conditions
        const currentDocs = onboardingDocuments.filter(d => d.provider_id === provider.id);
        if (currentDocs.length > 0) return;

        // Create Contractor Agreement
        await createOnboardingDocument({
          provider_id: provider.id,
          document_type: 'contractor_agreement',
          title: 'Security Labour Provider Agreement',
          content: 'TEMPLATE_CONTRACTOR_AGREEMENT',
          required: true,
          completed: false,
        });
        
        // Create NDA
        await createOnboardingDocument({
          provider_id: provider.id,
          document_type: 'nda',
          title: 'Non-Disclosure Agreement',
          content: 'TEMPLATE_NDA',
          required: true,
          completed: false,
        });
        
        // Reload documents to show them immediately
        await loadOnboardingDocuments(provider.id);
      }
    };
    
    generateDefaults();
  }, [hasLoadedDocs, provider, documents.length, onboardingDocuments, createOnboardingDocument, loadOnboardingDocuments]);
  
  // Determine onboarded status consistent with admin logic
  const requiredDocs = documents.filter((d) => d.required);
  const completedCount = requiredDocs.filter((d) => d.completed).length;
  const progress = requiredDocs.length > 0 ? (completedCount / requiredDocs.length) * 100 : 0;
  const allCompleted = requiredDocs.length > 0 && requiredDocs.every((d) => d.completed);
  const isPending = provider ? provider.status === 'pending' : false;
  
  const hasRequiredDocs = requiredDocs.length > 0;
  const hasSignedRequiredDocs = allCompleted;
  const onboarded = provider ? (provider.status === 'approved' && hasSignedRequiredDocs) : false;

  const [step, setStep] = useState<'details' | 'documents'>('details');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Supplier details form
  const [supplierDetails, setSupplierDetails] = useState({
    address: provider?.address || '',
    company_registration: provider?.company_registration || '',
    contact_phone: provider?.contact_phone || '',
    director_contact_name: provider?.director_contact_name || '',
  });

  useEffect(() => {
    if (onboarded) {
      router.push('/provider/dashboard');
    }
  }, [onboarded, router]);

  const handleSaveDetails = () => {
    if (!supplierDetails.address.trim() || !supplierDetails.director_contact_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Address and Director Contact Name).',
        variant: 'destructive',
      });
      return;
    }

    if (provider) {
      updateProviderDetails(provider.id, {
        address: supplierDetails.address,
        company_registration: supplierDetails.company_registration,
        contact_phone: supplierDetails.contact_phone,
        director_contact_name: supplierDetails.director_contact_name,
        submitted_at: provider.submitted_at || new Date().toISOString(),
      });
      setStep('documents');
      toast({
        title: 'Details Saved',
        description: 'Your company details have been saved.',
        variant: 'success',
      });
    }
  };

  const handleComplete = (docId: string) => {
    if (!signature.trim() || !signedName.trim()) {
      toast({
        title: 'Signature Required',
        description: 'Please provide both your signature and full name.',
        variant: 'destructive',
      });
      return;
    }

    if (!agreed) {
      toast({
        title: 'Agreement Required',
        description: 'Please confirm that you have read and agree to the terms.',
        variant: 'destructive',
      });
      return;
    }

    const doc = documents.find((d) => d.id === docId);
    if (doc && doc.document_type === 'contractor_agreement' && provider) {
      // Generate agreement with filled details
      const agreementContent = generateContractorAgreement({
        company_name: provider.company_name,
        address: provider.address || supplierDetails.address,
        company_registration: provider.company_registration || supplierDetails.company_registration,
        contact_email: provider.contact_email,
        contact_phone: provider.contact_phone || supplierDetails.contact_phone,
        signed_name: signedName,
        signed_date: new Date().toISOString(),
      });
      // Update document content with filled agreement
      // Note: In real implementation, this would be stored in the database
    }

    completeOnboardingDocument(docId, signature, signedName);
    toast({
      title: 'Document Completed',
      description: 'You have successfully completed this document.',
      variant: 'success',
    });
    setSelectedDoc(null);
    setSignature('');
    setSignedName('');
    setAgreed(false);

    // Check if all documents are now completed
    const updatedDocs = provider ? getOnboardingDocuments(provider.id) : [];
    const allCompleted = updatedDocs.filter((d) => d.required).every((d) => d.completed);
    if (allCompleted && provider) {
      // Update provider status to pending
      updateProviderDetails(provider.id, {
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      setShowDialog(true);
    }
  };

  const handleContinue = () => {
    setShowDialog(false);
  };

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Provider not found</p>
      </div>
    );
  }

  // Show pending status if all documents completed but not approved
  if (allCompleted && isPending) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-900">Account Pending Approval</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-white hover:bg-yellow-50">
                  Sign Out
                </Button>
              </div>
              <CardDescription className="text-yellow-700">
                Your onboarding documents have been submitted and are awaiting admin approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700">
                    Thank you for completing the onboarding process. Your account is currently pending
                    review by our admin team. You will receive a notification once your account has been
                    approved or if any additional information is required.
                  </p>
                </div>
                {provider.submitted_at && (
                  <p className="text-xs text-gray-600">
                    Submitted on: {format(new Date(provider.submitted_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (provider.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Account Rejected</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-white hover:bg-red-50">
                  Sign Out
                </Button>
              </div>
              <CardDescription className="text-red-700">
                Your account application has been rejected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {provider.rejection_reason && (
                <div className="bg-white p-4 rounded-lg border border-red-200 mb-4">
                  <p className="text-sm font-medium mb-2">Reason:</p>
                  <p className="text-sm text-gray-700">{provider.rejection_reason}</p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                If you believe this is an error, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Supplier Onboarding</h1>
            <p className="text-gray-600 mt-1">
              Complete the required information and documents to gain access to the system
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Please provide your company information before proceeding to sign the agreements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Company Address *</Label>
                <Textarea
                  id="address"
                  value={supplierDetails.address}
                  onChange={(e) =>
                    setSupplierDetails({ ...supplierDetails, address: e.target.value })
                  }
                  placeholder="Enter your full company address"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_registration">Company Registration Number</Label>
                <Input
                  id="company_registration"
                  value={supplierDetails.company_registration}
                  onChange={(e) =>
                    setSupplierDetails({
                      ...supplierDetails,
                      company_registration: e.target.value,
                    })
                  }
                  placeholder="e.g., 12345678 (Optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone Number</Label>
                <Input
                  id="contact_phone"
                  value={supplierDetails.contact_phone}
                  onChange={(e) =>
                    setSupplierDetails({ ...supplierDetails, contact_phone: e.target.value })
                  }
                  placeholder="e.g., +44 1234 567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="director_contact_name">Director Contact Name *</Label>
                <Input
                  id="director_contact_name"
                  value={supplierDetails.director_contact_name}
                  onChange={(e) =>
                    setSupplierDetails({ ...supplierDetails, director_contact_name: e.target.value })
                  }
                  placeholder="e.g., John Smith"
                />
              </div>
              <Button onClick={handleSaveDetails} className="w-full">
                Save and Continue to Documents
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'documents' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Progress</CardTitle>
                <CardDescription>
                  {completedCount} of {requiredDocs.length} required documents completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {documents.map((doc) => {
                // Generate agreement content if it's the contractor agreement or NDA
                let displayContent = doc.content;
                if (doc.document_type === 'contractor_agreement' && provider) {
                  displayContent = generateContractorAgreement({
                    company_name: provider.company_name,
                    address: provider.address || supplierDetails.address,
                    company_registration:
                      provider.company_registration || supplierDetails.company_registration,
                    contact_email: provider.contact_email,
                    contact_phone: provider.contact_phone || supplierDetails.contact_phone,
                    signed_name: doc.signed_name || provider.director_contact_name || supplierDetails.director_contact_name || '',
                    signed_date: doc.completed_at,
                  });
                } else if (doc.document_type === 'nda' && provider) {
                  displayContent = generateNDAAgreement({
                    company_name: provider.company_name,
                    address: provider.address || supplierDetails.address,
                    director_contact_name: provider.director_contact_name || supplierDetails.director_contact_name,
                    signed_name: doc.signed_name || provider.director_contact_name || supplierDetails.director_contact_name || '',
                    signed_date: doc.completed_at,
                  });
                }

                return (
                  <Card key={doc.id} className={doc.completed ? 'border-green-200' : ''}>
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
                      {doc.completed ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              Signed by: <span className="font-medium">{doc.signed_name || doc.signature}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Completed on:{' '}
                              {doc.completed_at && format(new Date(doc.completed_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Generate the final document content
                              let finalContent = '';
                              if (doc.document_type === 'contractor_agreement' && provider) {
                                finalContent = generateContractorAgreement({
                                  company_name: provider.company_name,
                                  address: provider.address || supplierDetails.address,
                                  company_registration:
                                    provider.company_registration || supplierDetails.company_registration,
                                  contact_email: provider.contact_email,
                                  contact_phone: provider.contact_phone || supplierDetails.contact_phone,
                                  signed_name: doc.signed_name || '',
                                  signed_date: doc.completed_at,
                                });
                              } else if (doc.document_type === 'nda' && provider) {
                                finalContent = generateNDAAgreement({
                                  company_name: provider.company_name,
                                  address: provider.address || supplierDetails.address,
                                  director_contact_name: provider.director_contact_name || supplierDetails.director_contact_name,
                                  signed_name: doc.signed_name || '',
                                  signed_date: doc.completed_at,
                                });
                              } else {
                                finalContent = doc.content;
                              }

                              // Create and download the file
                              const blob = new Blob([finalContent], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${doc.title.replace(/\s+/g, '_')}_${provider.company_name.replace(/\s+/g, '_')}_${format(new Date(doc.completed_at || new Date()), 'yyyy-MM-dd')}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);

                              toast({
                                title: 'Document Downloaded',
                                description: 'The signed document has been downloaded for your records.',
                                variant: 'success',
                              });
                            }}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download for Record Keeping
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">
                              {displayContent}
                            </pre>
                          </div>
                          {selectedDoc === doc.id ? (
                            <div className="space-y-4 border-t pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="signed-name">Your Full Name *</Label>
                                <Input
                                  id="signed-name"
                                  value={signedName}
                                  onChange={(e) => setSignedName(e.target.value)}
                                  placeholder="Enter your full name as it appears on official documents"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="signature">Your Signature *</Label>
                                <Input
                                  id="signature"
                                  value={signature}
                                  onChange={(e) => setSignature(e.target.value)}
                                  placeholder="Type your full name to sign"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`agree-${doc.id}`}
                                  checked={agreed}
                                  onCheckedChange={(checked) => setAgreed(checked === true)}
                                />
                                <Label
                                  htmlFor={`agree-${doc.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  I have read and agree to the terms and conditions outlined in this document
                                </Label>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleComplete(doc.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Sign and Complete
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button onClick={() => setSelectedDoc(doc.id)} className="w-full">
                              Review and Sign Document
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Onboarding Complete!
              </AlertDialogTitle>
              <AlertDialogDescription>
                Congratulations! You have successfully completed all required onboarding documents.
                Your account is now pending admin approval. You will receive a notification once your
                account has been reviewed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
