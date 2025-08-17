interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: "Project Setup" },
  { number: 2, title: "Site Visit" },
  { number: 3, title: "Activities Overview" },
  { number: 4, title: "Bill of Quantities" },
  { number: 5, title: "Document Generation" }
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="step-item">
              <div 
                className={`step-circle ${
                  currentStep === step.number ? 'active' : 'inactive'
                }`}
                data-testid={`step-${step.number}`}
              >
                {step.number}
              </div>
              <span 
                className={`ml-3 font-medium ${
                  currentStep === step.number ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`step-line ml-3 mr-3 ${
                  currentStep > step.number ? 'completed' : 'pending'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
