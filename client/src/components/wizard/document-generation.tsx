import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchMistralPriceQuotation } from "@/features/priceQuotationSlice";
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
  CheckCircle,
  Save,
  Calendar,
  BarChart3,
  Users,
  Package,
  Clock
} from "lucide-react";
import { ProjectWizardData, DocumentData, InternalCostData } from "@/lib/types";
import { selectWorksDescription, selectSiteVisitDescription, selectAllPatItemsStructured } from "@/features/priceQuotationSelectors";
import { selectProjectSetup } from "@/features/wizardSlice";


interface DocumentGenerationProps {
  onUpdate?: (updates: Partial<ProjectWizardData>) => void;
  onPrevious: () => void;
  onNewProject: () => void;
}

export default function DocumentGeneration({ onUpdate, onPrevious, onNewProject }: DocumentGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  // Load wizard/project data from Redux store (persisted)
  const data = useSelector((state: any) => state.wizard.projectSetup);

  // Calculate project totals from sample data
  const sampleSubtotal = 1974.86;
  const sampleMarkup = 691.20;
  const sampleTotal = 2666.06;
  const mainActivities = useSelector((state: any) => state.siteWorks.GeneralTimeline.Activities)
  
  const worksTimeline = useSelector(selectWorksDescription);
  const siteVisitDescription = useSelector(selectSiteVisitDescription);
  const billOfQuantities = useSelector(selectAllPatItemsStructured);
  const patItems = useSelector(selectAllPatItemsStructured);
  const client = useSelector(selectProjectSetup);
  const patItemsStr = JSON.stringify(patItems, null, 2); // for pretty-print, or just JSON.stringify(patItems)
  const priceQuotationPayload = `Site construction timeline is following: ${worksTimeline}. Site visit description is following: ${siteVisitDescription}. Bill of quantities is following: ${billOfQuantities}. Bill of quantity is following: ${patItemsStr}`;
  
  // Get LLM response from priceQuotation slice
  const priceQuotationData = useSelector((state: any) => state.priceQuotation.data);
  const priceQuotation = priceQuotationData?.price_quotation || [];
  const internalCosts = priceQuotationData?.internal_costs || {};
  // Compose documentData from LLM response
  const documentData: DocumentData = {
    client: {
      name: `${data?.clientFirstName || ''} ${data?.clientSurname || ''}`.trim(),
      email: data?.clientEmail || '',
      phone: data?.clientPhone || ''
    },
    project: {
      address: data?.siteAddress || '',
      date: new Date().toLocaleDateString('it-IT'),
      totalCost: priceQuotation.reduce((sum: number, item: any) => sum + (parseFloat(item.summary?.totalPriceWithVAT || 0) || 0), 0)
    },
    activities: priceQuotation.map((item: any) => ({ categoryName: item.activityName || item.activity, total: parseFloat(item.summary?.totalPriceWithVAT || 0) || 0 })),
    timeline: mainActivities.map((activity: any) => ({ phase: activity.Activity, duration: `Day ${activity.Starting} - ${activity.Finishing}` })),
  terms: (priceQuotationData?.terms && Array.isArray(priceQuotationData.terms)) ? priceQuotationData.terms : [],
  };
  console.log(data)
  // Compose internalCostData from LLM response
  const internalCostData: InternalCostData = {
    costBreakdown: {
      materials: parseFloat(internalCosts?.costBreakdown?.materials || 0),
      labor: parseFloat(internalCosts?.costBreakdown?.labor || 0),
      subcontractors: parseFloat(internalCosts?.costBreakdown?.subcontractors || 0),
      equipment: parseFloat(internalCosts?.costBreakdown?.equipment || 0),
      overhead: parseFloat(internalCosts?.costBreakdown?.overhead || 0),
      profit: parseFloat(internalCosts?.costBreakdown?.totalCost || 0)
    },
    materialsList: (internalCosts?.materialsList || []).map((mat: any) => ({
      item: `${mat.item}${mat.unit ? `: ${mat.quantity} ${mat.unit}` : ''}`,
      quantity: mat.quantity,
      unitPrice: mat.unitPrice
    })),
    personnel: (internalCosts?.personnel || []).map((person: any) => ({
      role: `${person.role}${person.count ? `: ${person.count} workers` : ''}`,
      duration: person.duration
    }))
  };
    // Handler for manual document generation
  const handleGenerateDocuments = () => {
    if (priceQuotationPayload) {
      dispatch(fetchMistralPriceQuotation(priceQuotationPayload));
    }
  };
  // Auto-generate on mount if not in Redux
  useEffect(() => {
    if (!priceQuotationData?.priceQuotation) {
      handleGenerateDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleDownloadQuotation = async () => {
    setIsGenerating(true);
    const payload = {
      ...data, // projectSetup
      priceQuotation: priceQuotationData?.price_quotation,
      internalCosts: priceQuotationData?.internal_costs,
    };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate_price_quotation_docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Price_Quotation_Report.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
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
    const payload = {
      ...data, // projectSetup
      priceQuotation: priceQuotationData?.price_quotation,
      internalCosts: priceQuotationData?.internal_costs,
    };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate_internal_costs_docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Internal_Costs_Report.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
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
          {/* Project Summary - now at the top and centered */}
          <div className="w-full flex flex-col items-center justify-center">
            <div className="bg-success-green/10 rounded-xl flex flex-col items-center p-6 w-full max-w-xl">
              <div className="w-16 h-16 bg-success-green text-white rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-bold text-text-primary mb-4">
                Price Quotation Completed
              </h3>
              <p className="text-text-secondary text-center">
                Your price quotation and internal costs are ready to share.
              </p>
            </div>
          </div>
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

                  <div className="flex flex-row items-start justify-between mb-2">
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-[10px] text-text-secondary">{documentData.client.name}</div>
                      <div className="text-[10px] text-text-secondary">{documentData.project.address}</div>
                      {documentData.client.phone && <div className="text-[10px] text-text-secondary">{documentData.client.phone}</div>}
                      <div className="text-[10px] text-text-secondary">{documentData.client.email}</div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end">
                      {data?.logo && (
                        <img src={data.logo} alt="Company Logo" className="h-14 mb-2" style={{objectFit: 'contain', maxWidth: '140px'}} />
                      )}
                    </div>
                  </div>
                  {/* Quotation Title and Committente above date */}
                  <div className="mb-2">
                    <div className="text-[13pt] leading-6 max-w-sm leading-2 font-semibold text-text-primary text-left mb-1">
                      QUOTAZIONE LAVORI DI RISTRUTTURAZIONE – Comune di Trento
                    </div>
                    <div className="flex flex-row items-center text-xs text-text-secondary mb-1">
                      <span className="font-semibold mr-1">Committente:</span>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary">{documentData.project.date}</div>

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
                          <div key={index}>{phase.phase}</div>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div>
                    <div className="font-semibold mb-2">Terms & Conditions:</div>
                    <div className="text-[10px] space-y-1">
                      {(documentData.terms && documentData.terms.length > 0)
                        ? documentData.terms.map((term, index) => (
                            <div key={index}>• {term}</div>
                          ))
                        : (
                            <div className="italic text-text-secondary">Nessuna condizione disponibile.</div>
                          )}
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

              <div className="flex space-x-3 gap-4">
                <Button
                  onClick={handleDownloadQuotation}
                  disabled={isGenerating}
                  className="flex-1 text-white py-2 rounded-full bg-[#f9a825] text-[#071330] px-8 font-graphik-bold text-xl shadow-md hover:bg-[#ffd95a] text-white  transition"
                  data-testid="button-download-quotation"
                >
                      <Download className="h-6 w-6 mr-2" />
                </Button>
                <Button
                  onClick={handleEmailQuotation}
                  disabled={isGenerating}
                  className="flex-1 border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white py-3 rounded-lg font-semibold transition-all"
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

                  {/* Project Schedule Progress Bar */}
                  <div>
                    <div className="font-semibold mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Project Schedule:
                    </div>
                    <div className="bg-white p-2 rounded border">
                      {Array.isArray(internalCosts?.projectSchedule) && internalCosts.projectSchedule.length > 0 ? (
                         <div className="w-full flex flex-col gap-1">
                          {/* Calculate min/max for timeline */}
                          {(() => {
                            const minStart = Math.min(...internalCosts.projectSchedule.map((a: any) => parseInt(a.starting)));
                            const maxFinish = Math.max(...internalCosts.projectSchedule.map((a: any) => parseInt(a.finishing)));
                            const totalSpan = maxFinish - minStart + 1;
                            return internalCosts.projectSchedule.map((phase: any, idx: number) => {
                              const start = parseInt(phase.starting);
                              const end = parseInt(phase.finishing);
                              const duration = end - start + 1;
                              const offset = start - minStart;
                              const percentOffset = (offset / totalSpan) * 100;
                              const percentWidth = (duration / totalSpan) * 100;
                              return (
                                 <div key={idx} className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-text-primary text-[10px] whitespace-nowrap min-w-[80px]">{phase.activity}</span>
                                   <div className="flex-1">
                                     <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                                      <div
                                        className="absolute left-0 top-0 h-full rounded-full"
                                        style={{
                                          left: `${percentOffset}%`,
                                          width: `${percentWidth}%`,
                                          background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                                          opacity: 0.95,
                                          minWidth: '2%',
                                          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  <span className="text-text-secondary text-[10px] whitespace-nowrap ml-2"></span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <div className="text-xs text-center text-text-secondary">
                          <BarChart3 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          No project schedule available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 gap-4">
                <Button
                  onClick={handleDownloadInternalCosts}
                  disabled={isGenerating}
                  className="flex-1 text-white py-2 rounded-full bg-[#f9a825] text-[#071330] px-8 font-graphik-bold text-xl shadow-md hover:bg-[#ffd95a] text-white  transition"
                  data-testid="button-download-quotation"
                >
                      <Download className="h-6 w-6 mr-2" />
                </Button>
                <Button
                  onClick={handleEmailMaterialsList}
                  disabled={isGenerating}
                  className="flex-1 border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white py-3 rounded-lg font-semibold transition-all"
                  data-testid="button-email-materials"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Email Materials List
                </Button>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
