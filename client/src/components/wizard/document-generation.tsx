import { useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Mail, 
  Edit, 
  Eye,
  FileText,
  Calculator,
  CheckCircle,
  Save,
  Building2,
  Calendar,
  BarChart3,
  Users,
  Package,
  Clock
} from "lucide-react";
import { ProjectWizardData, DocumentData, InternalCostData } from "@/lib/types";


interface DocumentGenerationProps {
  onUpdate?: (updates: Partial<ProjectWizardData>) => void;
  onPrevious: () => void;
  onNewProject: () => void;
}

export default function DocumentGeneration({ onUpdate, onPrevious, onNewProject }: DocumentGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  // Load wizard/project data from Redux store (persisted)
  const data = useSelector((state: any) => state.wizard.projectSetup);

  // Calculate project totals from sample data
  const sampleSubtotal = 1974.86;
  const sampleMarkup = 691.20;
  const sampleTotal = 2666.06;
  const mainActivities = useSelector((state: any) => state.siteWorks.GeneralTimeline.Activities)
  // Generate document data from project data
  console.log(mainActivities)
  const documentData: DocumentData = {
    client: {
      name: `${data?.clientFirstName || ''} ${data?.clientSurname || ''}`.trim(),
      email: data?.clientEmail || '',
      phone: data?.clientPhone || ''
    },
    project: {
      address: data?.siteAddress || '',
      date: new Date().toLocaleDateString('it-IT'),
      totalCost: sampleTotal
    },
    activities: mainActivities.map((activity: any) => ({ categoryName: activity.Activity, total: 123 })),
    timeline: mainActivities.map((activity: any) => ({ phase: activity.Activity, duration: `Day ${activity.Starting} - ${activity.Finishing}` })),
    terms: [
      "I prezzi indicati includono tutti gli attrezzi, materiali e oneri di smaltimento necessari per completare il lavoro a regola d’arte, secondo le misure del Vostro capitolato.",
      "In caso di esecuzione, sarà redatta una contabilità a consuntivo, verificata con la Direzione Lavori, basata sui prezzi unitari indicati e sulle misure effettivamente rilevate.",
      "Eventuali lavorazioni extra o variazioni non previste nel presente capitolato saranno quotate a parte.",
      "L’impresa garantirà l’assistenza tecnica e l’uso di materiali conformi alle normative vigenti.",
      "A Vs carico: la fornitura di acqua, uno spazio dove riporre i materiali e gli attrezzi, eventuale occupazione suolo pubblico, autorizzazioni, iva.",
      "Modalità di pagamento: acconto 40% alla conferma d’ordine e 30% alla conclusione.",
      "Ringraziando per l’attenzione, porgiamo cordiali saluti."
    ]
  };

  const internalCostData: InternalCostData = {
    costBreakdown: {
      materials: 1200.00,
      labor: 480.00,
      subcontractors: 294.86,
      equipment: 150.00,
      overhead: 531.22,
      profit: 265.61
    },
    materialsList: [
      { item: "Ceramic tiles: 30 m²", quantity: "30", unitPrice: "€35/m²" },
      { item: "Electrical outlets: 8 pcs", quantity: "8", unitPrice: "€25/pc" },
      { item: "Paint: 15L premium", quantity: "15", unitPrice: "€45/L" },
      { item: "Adhesive: 10 bags", quantity: "10", unitPrice: "€12/bag" }
    ],
    personnel: [
      { role: "Demolition crew: 2 workers", duration: "3 days" },
      { role: "Electrician: 1 specialist", duration: "5 days" },
      { role: "Tile installer: 1 expert", duration: "4 days" },
      { role: "Painter: 1 worker", duration: "2 days" }
    ]
  };

  const handleDownloadQuotation = async () => {
    setIsGenerating(true);
    // Simulate document generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Downloading quotation PDF");
    setIsGenerating(false);
  };

  const handleEmailQuotation = async () => {
    setIsGenerating(true);
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Sending quotation via email");
    setIsGenerating(false);
  };

  const handleDownloadInternalCosts = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Downloading internal costs");
    setIsGenerating(false);
  };

  const handleEmailMaterialsList = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Emailing materials list");
    setIsGenerating(false);
  };

  const handleEditQuotation = () => {
    console.log("Edit quotation");
  };

  const handlePreviewQuotation = () => {
    console.log("Preview quotation");
  };

  const handleEditInternalCosts = () => {
    console.log("Edit internal costs");
  };

  const handlePreviewInternalCosts = () => {
    console.log("Preview internal costs");
  };

  const handleSaveProject = () => {
    console.log("Saving project");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Price Quotation Document */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-primary flex items-center">
                  Price Quotation
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditQuotation}
                    className="text-primary hover:text-primary-dark"
                    data-testid="button-edit-quotation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviewQuotation}
                    className="text-primary hover:text-primary-dark"
                    data-testid="button-preview-quotation"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Document Preview */}
              <div className="bg-surface-light rounded-lg p-4 mb-6 h-96 overflow-y-auto">
                <div className="text-xs space-y-3">
                  {/* Logo and Project Info */}
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      {data?.logo && (
                        <img src={data.logo} alt="Company Logo" className="h-12 mb-2" style={{objectFit: 'contain', maxWidth: '120px'}} />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{documentData.project.address}</div>
                      <div>Date: {documentData.project.date}</div>
                    </div>
                  </div>

                  {/* Client Info (no label) */}
                  <div className="mt-2">
                    <div className="font-semibold">Client:</div>
                    <div>{documentData.client.name}</div>
                    {documentData.client.phone && <div>{documentData.client.phone}</div>}
                  </div>
                  {/* Email below Email: */}
                  <div className="mt-1">
                    <span className="font-semibold">Email:</span> {documentData.client.email}
                  </div>

                  {/* Activities Summary */}
                  <div>
                    <div className="font-semibold mb-2 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Construction Activities:
                    </div>
                    <div className="space-y-1 text-xs">
                      {documentData.activities.map((activity, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{activity.categoryName}</span>
                          <span>€{activity.total.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 font-semibold flex justify-between">
                        <span>Total</span>
                        <span>€{documentData.project.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <div className="font-semibold mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Project Timeline:
                    </div>
                    <div className="space-y-1 text-xs">
                      {documentData.timeline.map((phase, index) => (
                        <div key={index}>{phase.duration}: {phase.phase}</div>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div>
                    <div className="font-semibold mb-2">Terms & Conditions:</div>
                    <div className="text-xs space-y-1">
                      {documentData.terms.map((term, index) => (
                        <div key={index}>• {term}</div>
                      ))}
                    </div>
                  </div>
                  {/* Signature below Terms & Conditions */}
                  {data?.digitalSignature && (
                    <div className="mt-4 flex flex-col items-start">
                      <span className="text-xs text-gray-500 mb-1">Signature</span>
                      <img src={data.digitalSignature} alt="Signature" className="h-12 border rounded shadow" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDownloadQuotation}
                  disabled={isGenerating}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
                  data-testid="button-download-quotation"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Download PDF"}
                </Button>
                <Button
                  onClick={handleEmailQuotation}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1 bg-surface-light hover:bg-gray-200 text-text-primary py-3 rounded-lg font-medium transition-colors"
                  data-testid="button-email-quotation"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>

            {/* Internal Costs Document */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-primary flex items-center">
                  Internal Costs
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditInternalCosts}
                    className="text-primary hover:text-primary-dark"
                    data-testid="button-edit-internal-costs"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviewInternalCosts}
                    className="text-primary hover:text-primary-dark"
                    data-testid="button-preview-internal-costs"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Internal Costs Preview */}
              <div className="bg-surface-light rounded-lg p-4 mb-6 h-96 overflow-y-auto">
                <div className="text-xs space-y-3">
                  {/* Cost Breakdown */}
                  <div>
                    <div className="font-semibold mb-2">Cost Breakdown:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Materials</span>
                        <span>€{internalCostData.costBreakdown.materials.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor (Employees)</span>
                        <span>€{internalCostData.costBreakdown.labor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subcontractors</span>
                        <span>€{internalCostData.costBreakdown.subcontractors.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Equipment</span>
                        <span>€{internalCostData.costBreakdown.equipment.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-1 font-semibold flex justify-between">
                        <span>Direct Costs</span>
                        <span>€{(internalCostData.costBreakdown.materials + internalCostData.costBreakdown.labor + internalCostData.costBreakdown.subcontractors + internalCostData.costBreakdown.equipment).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Company Overhead (25%)</span>
                        <span>€{internalCostData.costBreakdown.overhead.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin (10%)</span>
                        <span>€{internalCostData.costBreakdown.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Materials List */}
                  <div>
                    <div className="font-semibold mb-2 flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      Materials to Order:
                    </div>
                    <div className="space-y-1 text-xs">
                      {internalCostData.materialsList.map((material, index) => (
                        <div key={index}>• {material.item} ({material.unitPrice})</div>
                      ))}
                    </div>
                  </div>

                  {/* Personnel */}
                  <div>
                    <div className="font-semibold mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Personnel Assignment:
                    </div>
                    <div className="space-y-1 text-xs">
                      {internalCostData.personnel.map((person, index) => (
                        <div key={index}>• {person.role} × {person.duration}</div>
                      ))}
                    </div>
                  </div>

                  {/* Gantt Chart Placeholder */}
                  <div>
                    <div className="font-semibold mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Project Schedule:
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="text-xs text-center text-text-secondary">
                        <BarChart3 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        Gantt Chart View
                        <br />
                        <span className="text-xs">Interactive timeline will be available in final document</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDownloadInternalCosts}
                  disabled={isGenerating}
                  className="flex-1 bg-accent-orange hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
                  data-testid="button-download-internal-costs"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleEmailMaterialsList}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1 bg-surface-light hover:bg-gray-200 text-text-primary py-3 rounded-lg font-medium transition-colors"
                  data-testid="button-email-materials"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Email Materials List
                </Button>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          <div className="mt-8 bg-success-green/10 border border-success-green rounded-xl p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success-green text-white rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Project Documentation Complete
                </h3>
                <p className="text-text-secondary">
                  Your professional quotation and internal cost analysis are ready for download and sharing.
                </p>
              </div>
            </div>
          </div>

          {/* Final Actions */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Button>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleSaveProject}
                className="bg-surface-light hover:bg-gray-200 text-text-primary px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-save-project"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Project
              </Button>
              <Button
                onClick={onNewProject}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-all"
                data-testid="button-new-project"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
