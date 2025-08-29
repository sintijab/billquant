import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { setProjectSetup } from '@/features/wizardSlice';
import { extractBoqPdfText } from '@/features/boqSlice';
import { fetchSiteWorks } from '@/features/siteWorksSlice';
import { useEffect as useToastEffect, useRef as useToastRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Upload, ArrowRight } from "lucide-react";
import Loader from '@/components/ui/loader';
import { ProjectWizardData } from "@/lib/types";
import { SignatureCapture } from "../signature-capture";

interface ProjectSetupProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: (stepOverride?: number) => void;
}

export default function ProjectSetup({ data, onUpdate, onNext }: ProjectSetupProps) {
  const reduxSetup = useSelector((state: any) => state.wizard?.projectSetup || {});
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signature, setSignatureState] = useState<string>("");
  const [logo, setLogo] = useState<string>(reduxSetup.logo || "");

  const [boqFile, setBoqFile] = useState<File | null>(null);
  const [boqUploadError, setBoqUploadError] = useState<string | null>(null);
  const boqInputRef = useRef<HTMLInputElement>(null);
  const boqLoading = useSelector((state: any) => state.boq.loading);
  const boqUploadText = useSelector((state: any) => state.boq.boq_upload);
  const siteWorksLoading = useSelector((state: any) => state.siteWorks.loading);

  // Handle logo upload as base64 for persistence
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogo(base64);
        dispatch(setProjectSetup({ logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Always persist generalAttachments from Redux if available and non-empty
    let merged = { ...data, ...reduxSetup };
    if (Array.isArray(reduxSetup.generalAttachments) && reduxSetup.generalAttachments.length > 0) {
      merged.generalAttachments = reduxSetup.generalAttachments;
    } else if (Array.isArray(data.generalAttachments) && data.generalAttachments.length > 0) {
      merged.generalAttachments = data.generalAttachments;
    }
    if (reduxSetup.generalNotes) merged.generalNotes = reduxSetup.generalNotes;
    if (reduxSetup.digitalSignature) merged.digitalSignature = reduxSetup.digitalSignature;
    onUpdate(merged);
    if (merged.digitalSignature) setSignatureState(merged.digitalSignature);
    // eslint-disable-next-line
  }, []);
  // Save signature to Redux and local state
  const handleSignatureCapture = (sig: string) => {
    setSignatureState(sig);
    dispatch(setProjectSetup({ digitalSignature: sig }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.projectType === 'upload_boq') {
      if (!boqUploadText) return;
      try {
        const result = await (dispatch as any)(fetchSiteWorks({ query: boqUploadText, is_boq: true }));
        if (result?.error) {
          toast({
            title: 'Failed to fetch activities',
            description: result.error.message || 'Could not fetch activities from BOQ.',
            variant: 'destructive',
          });
          return;
        }
        onNext(3); // Go to ActivitiesOverview (step 3)
      } catch (err: any) {
        toast({
          title: 'Failed to fetch activities',
          description: err?.message || 'Could not fetch activities from BOQ.',
          variant: 'destructive',
        });
      }
    } else {
      onNext();
    }
  };

  // Handle BOQ file upload and dispatch extractBoqPdfText immediately
  const handleBoqFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBoqFile(file);
    setBoqUploadError(null);
    if (file) {
      try {
        const result = await (dispatch as any)(extractBoqPdfText(file));
        if (result?.error || result?.payload?.error) {
          toast({
            title: 'PDF Extraction Error',
            description: result?.error?.message || result?.payload?.error || 'Failed to extract text from PDF.',
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        toast({
          title: 'PDF Extraction Error',
          description: err?.message || 'Failed to extract text from PDF.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <>
      {siteWorksLoading === 'pending' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <Loader size="xs" />
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg animate-fade-in">
          <CardContent className="md:p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-SEMIbold text-text-primary mb-4">
                Create Construction Proposal
              </h2>
              <p className="text-text-secondary text-lg">
                Choose your project type and provide client information to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Project Type Selection */}
              <div>
                <h3 className="text-l font-semibold text-text-primary mb-6">Project Type</h3>
                <p className="text-text-secondary mb-6">Select how you want to start your project</p>

                <RadioGroup
                  value={data.projectType}
                  onValueChange={(value: "site_visit" | "upload_boq") => onUpdate({ projectType: value })}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="flex items-center md:space-x-2">
                    <RadioGroupItem value="site_visit" id="site_visit" className="sr-only" />
                    <Label
                      htmlFor="site_visit"
                      className={`flex-1 cursor-pointer border rounded-xl p-6 transition-all hover:shadow-lg ${data.projectType === "site_visit"
                          ? "border-primary bg-primary/5"
                          : "border-gray-300 hover:border-primary bg-white"
                        }`}
                      data-testid="option-site-visit"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${data.projectType === "site_visit"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600"
                          }`}>
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-text-primary mb-2">Create New Site Visit</h4>
                          <p className="text-text-secondary text-sm">Start with site documentation and area mapping</p>
                        </div>
                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${data.projectType === "site_visit" ? "border-primary" : "border-gray-300"
                          }`}>
                          {data.projectType === "site_visit" && (
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center md:space-x-2">
                      <RadioGroupItem value="upload_boq" id="upload_boq" className="sr-only" />
                      <Label
                        htmlFor="upload_boq"
                        className={`flex-1 cursor-pointer border rounded-xl p-6 transition-all hover:shadow-lg ${data.projectType === "upload_boq"
                            ? "border-primary bg-primary/5"
                            : "border-gray-300 hover:border-primary bg-white"
                          }`}
                        data-testid="option-upload-boq"
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${data.projectType === "upload_boq"
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600"
                            }`}>
                            <Upload className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-text-primary mb-2">Upload Bill of Quantities</h4>
                            <p className="text-text-secondary text-sm">Import existing BOQ file for processing</p>
                          </div>
                          <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${data.projectType === "upload_boq" ? "border-primary" : "border-gray-300"
                            }`}>
                            {data.projectType === "upload_boq" && (
                              <div className="w-3 h-3 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                </div>
              </RadioGroup>
              {data.projectType === 'upload_boq' && (
                <div className="flex flex-col items-center mt-4">
                  <div className="w-full relative">
                    <label
                      htmlFor="boq-upload-input"
                      className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-primary/40 bg-white rounded-xl cursor-pointer transition hover:border-primary focus-within:border-primary select-none relative"
                      style={{ minHeight: '120px', pointerEvents: boqLoading ? 'none' : undefined, opacity: boqLoading ? 0.7 : 1 }}
                    >
                      <Upload className="h-8 w-8 text-primary mb-2" />
                      <span className="text-base font-medium text-primary mb-1">Upload or drop your BOQ</span>
                      <span className="text-xs text-gray-500 mb-2">PDF only, max 10MB</span>
                      <input
                        id="boq-upload-input"
                        ref={boqInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleBoqFileChange}
                      />
                      {boqFile && <span className="text-xs text-gray-700 mt-2">Selected: {boqFile.name}</span>}
                      {boqUploadError && <span className="text-xs text-red-600 mt-2">{boqUploadError}</span>}
                      {/* Loader overlay */}
                      {boqLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-xl select-none" style={{ pointerEvents: 'none' }}>
                          <Loader size="xs" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>



              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="btn-primary rounded-full flex items-center"
                  data-testid="button-continue"
                  disabled={
                    data.projectType === 'upload_boq' && (!boqUploadText || boqLoading)
                  }
                >
                  {data.projectType === "site_visit" ? "Continue to Site Visit" : "Continue to Timeline"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
