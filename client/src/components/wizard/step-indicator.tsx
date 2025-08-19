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

interface ProgressIndicatorProps {
  currentStep: number;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center">
                <div className={`w-8 h-8 aspect-square rounded-full flex items-center justify-center text-white font-semibold text-base leading-none ${
                  step.number <= currentStep ? 'bg-cad-blue' : 'bg-cad-gray'
                }`}>
                  {step.number}
                </div>
                <span className={`ml-2 font-medium ${
                  step.number <= currentStep ? 'text-cad-blue' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-16 h-px bg-cad-gray ml-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
