import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Navigation from "@/components/ui/navigation";
import StepIndicator from "@/components/wizard/step-indicator";
import ProjectSetup from "@/components/wizard/project-setup";
import SiteVisit from "@/components/wizard/site-visit";
import ActivitiesOverview from "@/components/wizard/activities-overview";
import BOQPricing from "@/components/wizard/boq-pricing";
import DocumentGeneration from "@/components/wizard/document-generation";
import { ProjectWizardData } from "@/lib/types";

const INITIAL_DATA: ProjectWizardData = {
  projectType: "site_visit",
  clientFirstName: "",
  clientSurname: "",
  clientPhone: "",
  clientEmail: "",
  siteAddress: "",
  digitalSignature: "",
  generalNotes: "",
  siteAreas: [],
  activityCategories: [],
  boqItems: [],
};

export default function ProjectWizard() {
  const [, params] = useRoute("/project/:step?");
  const [, setLocation] = useLocation();
  const currentStep = parseInt(params?.step || "1");
  const [projectData, setProjectData] = useState<ProjectWizardData>(INITIAL_DATA);

  useEffect(() => {
    if (currentStep < 1 || currentStep > 5) {
      setLocation("/project/1");
    }
  }, [currentStep, setLocation]);

  const handleStepChange = (step: number) => {
    if (step >= 1 && step <= 5) {
      setLocation(`/project/${step}`);
    }
  };

  const handleDataUpdate = (updates: Partial<ProjectWizardData>) => {
    setProjectData(prev => ({ ...prev, ...updates }));
  };

  const handleGetStarted = () => {
    setLocation("/");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProjectSetup
            data={projectData}
            onUpdate={handleDataUpdate}
            onNext={() => handleStepChange(2)}
          />
        );
      case 2:
        return (
          <SiteVisit
            data={projectData}
            onUpdate={handleDataUpdate}
            onNext={() => handleStepChange(3)}
            onPrevious={() => handleStepChange(1)}
          />
        );
      case 3:
        return (
          <ActivitiesOverview
            data={projectData}
            onUpdate={handleDataUpdate}
            onNext={() => handleStepChange(4)}
            onPrevious={() => handleStepChange(2)}
          />
        );
      case 4:
        return (
          <BOQPricing
            data={projectData}
            onUpdate={handleDataUpdate}
            onNext={() => handleStepChange(5)}
            onPrevious={() => handleStepChange(3)}
          />
        );
      case 5:
        return (
          <DocumentGeneration
            data={projectData}
            onUpdate={handleDataUpdate}
            onPrevious={() => handleStepChange(4)}
            onNewProject={() => {
              setProjectData(INITIAL_DATA);
              setLocation("/project/1");
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-light">
      <Navigation onGetStarted={handleGetStarted} />
      
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>

      <div className="pb-20">
        {renderStep()}
      </div>
    </div>
  );
}
