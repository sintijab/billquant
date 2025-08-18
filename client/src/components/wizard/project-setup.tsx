import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Upload, ArrowRight } from "lucide-react";
import { ProjectWizardData } from "@/lib/types";

interface ProjectSetupProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
}

export default function ProjectSetup({ data, onUpdate, onNext }: ProjectSetupProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!data.clientFirstName) newErrors.clientFirstName = "First name is required";
    if (!data.clientSurname) newErrors.clientSurname = "Surname is required";
    if (!data.clientEmail) newErrors.clientEmail = "Email is required";
    if (!data.siteAddress) newErrors.siteAddress = "Site address is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onNext();
  };

  const handleInputChange = (field: keyof ProjectWizardData, value: string) => {
    onUpdate({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Create Construction Proposal
            </h2>
            <p className="text-text-secondary text-lg">
              Choose your project type and provide client information to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Project Type Selection */}
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-6">Project Type</h3>
              <p className="text-text-secondary mb-6">Select how you want to start your project</p>
              
              <RadioGroup
                value={data.projectType}
                onValueChange={(value: "site_visit" | "upload_boq") => onUpdate({ projectType: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="site_visit" id="site_visit" className="sr-only" />
                  <Label
                    htmlFor="site_visit"
                    className={`flex-1 cursor-pointer border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                      data.projectType === "site_visit"
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary bg-white"
                    }`}
                    data-testid="option-site-visit"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        data.projectType === "site_visit" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
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

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload_boq" id="upload_boq" className="sr-only" />
                  <Label
                    htmlFor="upload_boq"
                    className={`flex-1 cursor-pointer border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                      data.projectType === "upload_boq"
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary bg-white"
                    }`}
                    data-testid="option-upload-boq"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        data.projectType === "upload_boq" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-text-primary mb-2">Upload Bill of Quantities</h4>
                        <p className="text-text-secondary text-sm">Import existing BOQ file for processing</p>
                      </div>
                      <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                        data.projectType === "upload_boq" ? "border-primary" : "border-gray-300"
                      }`}>
                        {data.projectType === "upload_boq" && (
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Client Information Form */}
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-6">Client Information</h3>
              <p className="text-text-secondary mb-6">Enter the client details for this project</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientFirstName" className="text-sm font-medium text-text-primary">
                    Client First Name
                  </Label>
                  <Input
                    id="clientFirstName"
                    type="text"
                    placeholder="Marco"
                    value={data.clientFirstName}
                    onChange={(e) => handleInputChange("clientFirstName", e.target.value)}
                    className={errors.clientFirstName ? "border-red-500" : ""}
                    data-testid="input-client-first-name"
                  />
                  {errors.clientFirstName && (
                    <p className="text-sm text-red-500">{errors.clientFirstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientSurname" className="text-sm font-medium text-text-primary">
                    Client Surname
                  </Label>
                  <Input
                    id="clientSurname"
                    type="text"
                    placeholder="Rossi"
                    value={data.clientSurname}
                    onChange={(e) => handleInputChange("clientSurname", e.target.value)}
                    className={errors.clientSurname ? "border-red-500" : ""}
                    data-testid="input-client-surname"
                  />
                  {errors.clientSurname && (
                    <p className="text-sm text-red-500">{errors.clientSurname}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-sm font-medium text-text-primary">
                    Client Phone
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="+39 333 123 4567"
                    value={data.clientPhone}
                    onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                    data-testid="input-client-phone"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-sm font-medium text-text-primary">
                    Client Email
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="marco.rossi@email.com"
                    value={data.clientEmail}
                    onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                    className={errors.clientEmail ? "border-red-500" : ""}
                    data-testid="input-client-email"
                  />
                  {errors.clientEmail && (
                    <p className="text-sm text-red-500">{errors.clientEmail}</p>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="siteAddress" className="text-sm font-medium text-text-primary">
                    Site Address
                  </Label>
                  <Input
                    id="siteAddress"
                    type="text"
                    placeholder="Via Roma 123, 20121 Milano, Italy"
                    value={data.siteAddress}
                    onChange={(e) => handleInputChange("siteAddress", e.target.value)}
                    className={errors.siteAddress ? "border-red-500" : ""}
                    data-testid="input-site-address"
                  />
                  {errors.siteAddress && (
                    <p className="text-sm text-red-500">{errors.siteAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* General Notes */}
            <div>
              <Label htmlFor="generalNotes" className="text-sm font-medium text-text-primary">
                General Notes (Optional)
              </Label>
              <Textarea
                id="generalNotes"
                placeholder="Add any additional notes about the project, special requirements, or constraints..."
                value={data.generalNotes}
                onChange={(e) => handleInputChange("generalNotes", e.target.value)}
                className="mt-2"
                data-testid="textarea-general-notes"
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="btn-primary flex items-center"
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
