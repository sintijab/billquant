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
import { useDispatch } from "react-redux";
import { resetSiteWorks } from "@/features/siteWorksSlice";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

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
  aiConsent: true,
  generalAttachments: []
};

export default function ProjectWizard() {
  const [, params] = useRoute("/project/:step?");
  const [, setLocation] = useLocation();
  const currentStep = parseInt(params?.step || "1");
  const [projectData, setProjectData] = useState<ProjectWizardData>(INITIAL_DATA);
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentStep < 1 || currentStep > 5) {
      setLocation("/project/1");
    }
    if (currentStep === 1) {
      dispatch(resetSiteWorks());
    }
  }, [currentStep, setLocation, dispatch]);

  const handleStepChange = (step: number) => {
    if (step >= 1 && step <= 5) {
      setLocation(`/project/${step}`);
    }
  };

  const handleDataUpdate = (updates: Partial<ProjectWizardData>) => {
    setProjectData(prev => ({ ...prev, ...updates }));
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
    <div className="relative min-h-screen bg-surface-light overflow-hidden">
      {/* Blurred BIM2 overlay background with white overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 flex justify-center items-start">
        <img
          src="/bim1.jpeg"
          alt="BIM2 Overlay"
          className="w-full opacity-90 select-none object-cover object-top"
          style={{ filter: 'blur(5px)', marginTop: '20vh' }}
        />
        <div className="absolute inset-0 bg-white opacity-80" />
      </div>
      <div className="relative z-10"> <SignedIn>
        <Navigation />
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <StepIndicator currentStep={currentStep} />
          </div>
        </div>
        <div className="pb-10">
          {renderStep()}
          <div className="flex flex-col items-center justify-center mt-12 mb-6 text-xs text-gray-500">
            <div className="text-base">All rights reserved by European Management.</div>
            <div className="flex items-center justify-center mt-2">
              <span>AI software developed with</span>
              <a href="https://cofun.digital/" target="_blank" className="block" rel="noopener noreferrer">
                <img src="/CO-FUN_logo.png" alt="CO-FUN Logo" className="inline-block h-2 align-middle ml-2" />
              </a>
            </div>
          </div>
        </div>
      </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut></div>
    </div>
  );
}
