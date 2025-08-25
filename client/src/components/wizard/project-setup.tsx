import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setProjectSetup } from '@/features/wizardSlice';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Upload, ArrowRight } from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import { SignatureCapture } from "../signature-capture";

interface ProjectSetupProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
}

export default function ProjectSetup({ data, onUpdate, onNext }: ProjectSetupProps) {
  const reduxSetup = useSelector((state: any) => state.wizard?.projectSetup || {});
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signature, setSignatureState] = useState<string>("");
  const [logo, setLogo] = useState<string>(reduxSetup.logo || "");
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
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
                    className={`flex-1 cursor-pointer border rounded-xl p-6 transition-all hover:shadow-lg ${
                      data.projectType === "site_visit"
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary bg-white"
                    }`}
                    data-testid="option-site-visit"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        data.projectType === "site_visit"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-text-primary mb-2">Create New Site Visit</h4>
                        <p className="text-text-secondary text-sm">Start with site documentation and area mapping</p>
                      </div>
                      <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                        data.projectType === "site_visit" ? "border-primary" : "border-gray-300"
                      }`}>
                        {data.projectType === "site_visit" && (
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center md:space-x-2 opacity-50 pointer-events-none select-none">
                  <RadioGroupItem value="upload_boq" id="upload_boq" className="sr-only" disabled />
                  <Label
                    htmlFor="upload_boq"
                    className={`flex-1 border rounded-xl p-6 bg-gray-100 border-gray-300 cursor-not-allowed`}
                    data-testid="option-upload-boq"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-text-primary mb-2">Upload Bill of Quantities</h4>
                        <p className="text-text-secondary text-sm">Import existing BOQ file for processing</p>
                      </div>
                      <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center border-gray-300">
                        {/* Disabled, so no inner dot */}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>



            {/* Action Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="btn-primary rounded-full flex items-center"
                data-testid="button-continue"
              >
                {data.projectType === "site_visit" ? "Continue to Site Visit" : "Continue to BOQ Upload"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
