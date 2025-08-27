import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchMistralPriceQuotation, clearPriceQuotationData } from "@/features/priceQuotationSlice";
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
  Clock,
  Upload
} from "lucide-react";
import { ProjectWizardData, DocumentData, InternalCostData } from "@/lib/types";
import { setProjectSetup } from '@/features/wizardSlice';
import { SignatureCapture } from "../signature-capture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectWorksDescription, selectSiteVisitDescription, selectAllPatItemsStructured } from "@/features/priceQuotationSelectors";
import { selectProjectSetup } from "@/features/wizardSlice";
import Loader from "../ui/loader";


interface DocumentGenerationProps {
  onUpdate?: (updates: Partial<ProjectWizardData>) => void;
  onPrevious: () => void;
  onNewProject: () => void;
}

export default function DocumentGeneration({ onUpdate, onPrevious, onNewProject }: DocumentGenerationProps) {
  // Always merge Redux and local data for attachments, notes, and signature on mount
  useEffect(() => {
    const reduxSetup = data; // data is already from Redux
    let merged = { ...data, ...reduxSetup };
    if (Array.isArray(reduxSetup.generalAttachments) && reduxSetup.generalAttachments.length > 0) {
      merged.generalAttachments = reduxSetup.generalAttachments;
    } else if (Array.isArray(data.generalAttachments) && data.generalAttachments.length > 0) {
      merged.generalAttachments = data.generalAttachments;
    }
    if (reduxSetup.generalNotes) merged.generalNotes = reduxSetup.generalNotes;
    if (reduxSetup.digitalSignature) merged.digitalSignature = reduxSetup.digitalSignature;
    if (onUpdate) onUpdate(merged);
    if (merged.digitalSignature) setSignatureState(merged.digitalSignature);
    // eslint-disable-next-line
  }, []);
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
  console.log(priceQuotationData)
  const priceQuotationLoading = useSelector((state: any) => state.priceQuotation.loading);
  const internalCosts = priceQuotationData || {};
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
      totalCost: parseFloat(internalCosts?.price_summary?.application_price || 0)
    },
    activities: !!internalCosts?.direct_costs && internalCosts?.direct_costs?.map((item: any) => ({ category: item.category || item.description, total: parseFloat(item.total_price || 0) || 0 })),
    timeline: (internalCosts?.projectSchedule || []).map((activity: any) => ({
      phase: activity.activity,
      duration: `Day ${activity.starting} - ${activity.finishing}`
    })),
  };

  // Compose internalCostData from LLM response
  const internalCostData: InternalCostData = {
    costBreakdown: {
      materials: parseFloat(internalCosts?.price_summary?.summary_by_category?.material_cost_fc || 0),
      labor: parseFloat(internalCosts?.price_summary?.summary_by_category?.workers_cost || 0),
      subcontractors: parseFloat(internalCosts?.price_summary?.summary_by_category?.subcontractors_cost || 0),
      equipment: parseFloat(internalCosts?.price_summary?.summary_by_category?.equipment_cost || 0),
      overhead: !!internalCosts?.indirect_costs && internalCosts?.indirect_costs?.map((item: any) => parseFloat(item.total_price)).reduce((acc: number, val: number) => acc + val, 0) || 0,
      profit: parseFloat(internalCosts?.price_summary?.company_profit || 0)
    },
    materialsList: (internalCosts?.materialsList || []).map((mat: any) => ({
      item: `${mat.item}${mat.unit ? `: ${mat.total_quantity} ${mat.unit}` : ''}`,
      quantity: mat.total_quantity,
      unitPrice: mat.unitPrice
    })),
    personnel: (internalCosts?.personnel || []).map((person: any) => ({
      role: `${person.role}${person.count ? `: ${person.count} workers` : ''}`,
      duration: person.duration,
      quantity: person.quantity,
      unit_measure: person.unit_measure
    }))
  };

  // Clear priceQuotation data/loading state on mount
  useEffect(() => {
    dispatch(clearPriceQuotationData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Handler for manual document generation
  const handleGenerateDocuments = () => {
    if (priceQuotationPayload) {
      dispatch(fetchMistralPriceQuotation(priceQuotationPayload));
    }
  };
  // Auto-generate on mount if not in Redux
  // useEffect(() => {
  //   if (!priceQuotationData?.price_quotation) {
  //     handleGenerateDocuments();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const [logo, setLogo] = useState<string>(data.logo || "");
  const [signature, setSignatureState] = useState<string>(data.digitalSignature || "");
  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogo(base64);
        dispatch(setProjectSetup({ logo: base64 }));
        if (onUpdate) onUpdate({ logo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };
  // Digital signature handler
  const handleSignatureCapture = (sig: string) => {
    setSignatureState(sig);
    dispatch(setProjectSetup({ digitalSignature: sig }));
    if (onUpdate) onUpdate({ digitalSignature: sig });
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Handlers for client info form
  const handleInputChange = (field: keyof ProjectWizardData, value: string) => {
    dispatch(setProjectSetup({ [field]: value }));
    if (onUpdate) onUpdate({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  const handleInputBlur = (field: keyof ProjectWizardData, value: string) => {
    dispatch(setProjectSetup({ [field]: value }));
    if (onUpdate) onUpdate({ [field]: value });
  };

  const handleDownloadQuotation = async () => {
    setIsGenerating(true);
    const payload = {
      ...data, // projectSetup
      internalCosts: priceQuotationData,
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
    // Generate and download the quotation DOCX
    const payload = {
      ...data, // projectSetup
      internalCosts: priceQuotationData,
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
      // Open email client with subject and body
      const subject = encodeURIComponent('Price Quotation');
      const body = encodeURIComponent('Please find attached the Price Quotation document.\n\n(If the file is not attached automatically, please attach the downloaded Price_Quotation_Report.docx file to this email.)');
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
    setIsGenerating(false);
  };

  const handleDownloadInternalCosts = async () => {
    setIsGenerating(true);
    const payload = {
      ...data, // projectSetup
      internalCosts: priceQuotationData,
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
    // Compose email subject
    const subject = encodeURIComponent("Materials to order");
    // Compose bullet list body from priceQuotationData.materials
    const materials = priceQuotationData?.internal_costs?.materialsList || [];
    let body = "";
    if (materials.length > 0) {
      body += `Materials to order:%0D%0A%0D%0A`;
      materials.forEach((mat: any, idx: number) => {
        body += `• Material ${idx + 1}:%0D%0A`;
        body += `  Name: ${mat.item || ''}%0D%0A`;
        body += `  Quantity: ${mat.quantity || ''}%0D%0A`;
        body += `  Unit: ${mat.unity || ''}%0D%0A`;
        body += `  Price per unit: ${mat.unitPrice || ''}%0D%0A`;
        body += `  Provider price: ${mat.price_of_unity_provider || ''}%0D%0A`;
        body += `  Company cost (EUR): ${mat.company_cost_eur || ''}%0D%0A`;
        body += `  Markup (%): ${mat.markup_percentage || ''}%0D%0A`;
        body += `  Final cost for client (EUR): ${mat.final_cost_for_client_eur || ''}%0D%0A%0D%0A`;
      });
    } else {
      body = "No materials to order.";
    }
    // Compose mailto link
    const mailto = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    setIsGenerating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {priceQuotationLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <Loader size="xs" />
        </div>
      )}
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-2 lg:p-8">
          {!priceQuotationData && <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-SEMIbold text-text-primary mb-4">
                Client Information
              </h2>
              <p className="text-text-secondary text-lg">
                Enter the client details for this project to send the price proposal.
              </p>
            </div>
            <div className="mt-8 mb-8 max-w-xl mx-auto w-full">
              <div className="flex flex-col gap-6 w-full">
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
                    onBlur={(e) => handleInputBlur("clientFirstName", e.target.value)}
                    className={`transition-all bg-white/60 backdrop-blur px-5 py-6 rounded-full text-l shadow focus:shadow-lg focus:shadow-primary/40 active:shadow-primary/60 outline-none focus:outline-none focus-visible:outline-none border-0 focus:border focus:border-primary focus:border-[1px] placeholder:text-gray-400 ${errors.clientFirstName ? "ring-2 ring-red-500" : ""}`}
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
                    onBlur={(e) => handleInputBlur("clientSurname", e.target.value)}
                    className={`transition-all bg-white/60 backdrop-blur px-5 py-6 rounded-full text-l shadow focus:shadow-lg focus:shadow-primary/40 active:shadow-primary/60 outline-none focus:outline-none focus-visible:outline-none border-0 focus:border focus:border-primary focus:border-[1px] placeholder:text-gray-400 ${errors.clientSurname ? "ring-2 ring-red-500" : ""}`}
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
                    onBlur={(e) => handleInputBlur("clientPhone", e.target.value)}
                    className="transition-all bg-white/60 backdrop-blur px-5 py-6 rounded-full text-l shadow focus:shadow-lg focus:shadow-primary/40 active:shadow-primary/60 outline-none focus:outline-none focus-visible:outline-none border-0 focus:border focus:border-primary focus:border-[1px] placeholder:text-gray-400"
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
                    onBlur={(e) => handleInputBlur("clientEmail", e.target.value)}
                    className={`transition-all bg-white/60 backdrop-blur px-5 py-6 rounded-full text-l shadow focus:shadow-lg focus:shadow-primary/40 active:shadow-primary/60 outline-none focus:outline-none focus-visible:outline-none border-0 focus:border focus:border-primary focus:border-[1px] placeholder:text-gray-400 ${errors.clientEmail ? "ring-2 ring-red-500" : ""}`}
                    data-testid="input-client-email"
                  />
                  {errors.clientEmail && (
                    <p className="text-sm text-red-500">{errors.clientEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteAddress" className="text-sm font-medium text-text-primary">
                    Site Address
                  </Label>
                  <Input
                    id="siteAddress"
                    type="text"
                    placeholder="Via Roma 123, 20121 Milano, Italy"
                    value={data.siteAddress}
                    onChange={(e) => handleInputChange("siteAddress", e.target.value)}
                    onBlur={(e) => handleInputBlur("siteAddress", e.target.value)}
                    className={`transition-all bg-white/60 backdrop-blur px-5 py-6 rounded-full text-l shadow focus:shadow-lg focus:shadow-primary/40 active:shadow-primary/60 outline-none focus:outline-none focus-visible:outline-none border-0 focus:border focus:border-primary focus:border-[1px] placeholder:text-gray-400 ${errors.siteAddress ? "ring-2 ring-red-500" : ""}`}
                    data-testid="input-site-address"
                  />
                  {errors.siteAddress && (
                    <p className="text-sm text-red-500">{errors.siteAddress}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Logo Upload */}
            <div className="text-left mb-8 max-w-xl mx-auto w-full">
              <input
                id="logo-upload-input"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                data-testid="input-logo-upload"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('logo-upload-input')?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-primary text-primary hover:bg-primary hover:text-white transition-colors shadow"
                data-testid="button-upload-logo"
              >
                <Upload className="h-5 w-5" />
                {logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {logo && (
                <div className="mt-4">
                  <img src={logo} alt="Company logo" className="max-w-full h-20 mx-auto border rounded-2xl shadow" />
                  <p className="text-green-400 text-sm mt-2">Logo uploaded successfully</p>
                </div>
              )}
            </div>

            {/* Digital Signature */}
            <div className="mb-8 max-w-xl mx-auto w-full">
              <div className="border border-dashed border-primary-blue rounded-2xl p-8 text-center hover:border-cad-blue transition-colors bg-white/40 backdrop-blur">
                <div className="text-4xl text-cad-blue mb-4">
                  <i className="fas fa-signature"></i>
                </div>
                <p className="text-gray-400 mb-4">Upload your signature or use digital signing pad</p>
                <SignatureCapture onSignatureCapture={handleSignatureCapture}>
                  <Button
                    type="button"
                    className="bg-cad-blue hover:bg-cad-blue-dark px-6 py-3 rounded-full text-base shadow-md"
                    data-testid="button-capture-signature"
                  >
                    Capture Signature
                  </Button>
                </SignatureCapture>
                {signature && (
                  <div className="mt-4">
                    <img src={signature} alt="Captured signature" className="max-w-full h-20 mx-auto border rounded-2xl shadow" />
                    <p className="text-green-400 text-sm mt-2">Signature captured successfully</p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={onPrevious}
                  className="text-text-secondary hover:text-text-primary"
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Pricing
                </Button>
                <Button
                  onClick={handleGenerateDocuments}
                  disabled={priceQuotationLoading}
                  className="bg-primary text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-primary-dark transition"
                  data-testid="button-regenerate-quotation"
                >
                  {priceQuotationLoading ? 'Creating...' : 'Create Quotation'}
                </Button>
              </div>
            </div>
          </>}
          {priceQuotationData && <>
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
                  {/* <div className="flex space-x-2">
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
                </div> */}
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
                          <img src={data.logo} alt="Company Logo" className="h-14 mb-2" style={{ objectFit: 'contain', maxWidth: '140px' }} />
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
                        {!!documentData?.activities && documentData?.activities?.map((activity, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{activity.category}</span>
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
                    disabled={true}
                    className="flex-1 border-2 border-primary text-primary bg-transparent py-3 rounded-lg font-semibold transition-all opacity-50 cursor-not-allowed"
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
                  {/* <div className="flex space-x-2">
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
                </div> */}
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
                          <div key={index}>• {person.role} × {person.duration || person.quantity  + ' ' + person.unit_measure}</div>
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
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    dispatch(clearPriceQuotationData());
                  }}
                  className="text-text-secondary hover:text-text-primary"
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Client details
                </Button>
              </div>
            </div>
            
            </>}
        </CardContent>
      </Card>
    </div>
  );
}
