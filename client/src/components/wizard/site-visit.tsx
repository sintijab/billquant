import { useRef, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store';
import { fetchSiteWorks } from '@/features/siteWorksSlice';
import { resetSiteWorks } from '@/features/siteWorksSlice';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Plus, Upload, FileText, ImageIcon, X, SearchCheck } from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import SubareaCard from "./subarea-card";
import NotificationProgressBar from './NotificationProgressBar';
import Loader from "../ui/loader";
import { formatAreaData } from "@/lib/formatAreaData";
import { setSiteVisit } from "@/features/siteVisitSlice";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface SiteVisitProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function SiteVisit({ data: initial, onUpdate, onNext, onPrevious }: SiteVisitProps) {
  // Track which areas have been saved
  const data = initial;
  const [savedAreas, setSavedAreas] = useState(() => data.siteAreas.map(() => false));
  function collectAllAreaAndSubareaFields(siteAreas: any[]) {
    return siteAreas.map(area => ({
      ...area,
      subareas: area.subareas?.map((sub: any) => ({ ...sub })) || []
    }));
  }
  const [showExtractedTextModal, setShowExtractedTextModal] = useState<{ open: boolean; text: string }>({ open: false, text: "" });
  // Get the full redux state for site visit
  const siteVisitState = data;
  const siteWorksLoading = useSelector((state: any) => state.siteWorks.loading);
  const dispatch: AppDispatch = useDispatch();
  const reduxGeneralAttachments = useSelector((state: any) => state.siteVisit?.generalAttachments || []);
  const [generalNotes, setGeneralNotes] = useState(data.generalNotes || "");
  const [generalAttachments, setGeneralAttachments] = useState<{ url: string; title: string }[]>(
    (reduxGeneralAttachments && reduxGeneralAttachments.length > 0)
      ? reduxGeneralAttachments
      : (data.generalAttachments || [])
  );
  const [aiConsent, setAiConsent] = useState(true);
  const siteWorksLength = useSelector((state: any) => state.siteWorks?.Works?.length || 0);
  const handleAddArea = () => {
    // Validation: check if any subarea input field, dimensions, UDM, or description is empty
    let hasEmptySubarea = false;
    let missingField = '';
    data.siteAreas.forEach((area, areaIdx) => {
      (area.subareas || []).forEach((subarea: any, subIdx: number) => {
        subarea.items.forEach((sub: any) => {
        // Name
        const nameInput = document.querySelector(
          `input[data-area-idx='${areaIdx}'][data-sub-idx='${subIdx}']`
        ) as HTMLInputElement | null;
        if (!nameInput || !nameInput.value.trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea name';
        }
        // Dimensions
        if (!sub.dimensions || !sub.dimensions.toString().trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea dimensions';
        }
        // UDM
        if (!sub.udm || !sub.udm.toString().trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea UDM';
        }
        // Description
        if (!sub.description || !sub.description.toString().trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea description';
        }
      });
    })
    });
    if (hasEmptySubarea) {
      toast({
        title: `${missingField} required`,
        description: `Please fill in all ${missingField.toLowerCase()}s before adding a new area.`,
        variant: "destructive",
      });
      return;
    }
    const areaIdx = data.siteAreas.length;
    const newArea = {
      id: `area-${Date.now()}`,
      name: `Area no. ${areaIdx + 1}`,
      statusDescription: "",
      whatToDo: "",
      totalArea: "",
      udm: "",
      quantity: "",
      attachmentNote: "",
      floorAttachments: [],
      subareas: [],
      priority: "medium" as "medium"
    };
    const updated = { siteAreas: [...data.siteAreas, newArea] };
    onUpdate(updated);
    dispatch(setSiteVisit(updated));
  };

  const handleAddSubarea = (areaId: string) => {
    // Validation: check if any subarea input field, dimensions, UDM, or description is empty in this area
    const areaIdx = data.siteAreas.findIndex((a: any) => a.id === areaId);
    const area = data.siteAreas[areaIdx];
    let hasEmptySubarea = false;
    let missingField = '';
    (area.subareas || []).forEach((subarea: any, i: number) => {
      subarea.items.forEach((sub: any) => {
        // Name
        const nameInput = document.querySelector(
          `input[data-area-idx='${areaIdx}'][data-sub-idx='${i}']`
        ) as HTMLInputElement | null;
        console.log(sub)
                debugger;
        if (!nameInput || !nameInput.value.trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea name';
        }
        // Dimensions
        if (!sub.dimensions || !sub.dimensions.toString().trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea dimensions';
        }
        // UDM
        if (!sub.udm || !sub.udm.toString().trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea UDM';
        }
        // Description
        if (!sub.description || !sub.description.toString().trim()) {
          hasEmptySubarea = true;
          missingField = 'Subarea description';
        }
      });
      if (hasEmptySubarea) {
        toast({
          title: `${missingField} required`,
          description: `Please fill in all ${missingField.toLowerCase()}s before adding a new subarea.`,
          variant: "destructive",
        });
        return;
      }
      return;
    })
    const subIdx = area && area.subareas ? area.subareas.length : 0;
    const newSubarea = {
      id: `subarea-${Date.now()}`,
      title: `Subarea no. ${subIdx + 1}`,
      items: []
    };
    const updated = {
      siteAreas: data.siteAreas.map(area =>
        area.id === areaId
          ? { ...area, subareas: [...area.subareas, newSubarea] }
          : area
      )
    };
    onUpdate(updated);
    dispatch(setSiteVisit(updated));
    // For add area/subarea, just use currentSiteTimeline
    dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: currentSiteWorks, Missing: [], GeneralTimeline: currentSiteTimeline } });
  };


  // Whenever site visit data changes, update redux
  const handleUpdate = (updates: Partial<ProjectWizardData>) => {
    onUpdate(updates);
  };
  const [attachmentPopover, setAttachmentPopover] = useState(false);
  const [areaPlanLoading, setAreaPlanLoading] = useState(false);
  const [generalAttachmentLoading, setGeneralAttachmentLoading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const siteWorksError = useSelector((state: any) => state.siteWorks.error);
  const currentSiteWorks = useSelector((state: any) => state.siteWorks?.Works || []);
  const currentSiteTimeline = useSelector((state: any) => state.siteWorks?.GeneralTimeline || null);

  useEffect(() => {
    if (siteWorksError) {
      toast({
        title: "Something went wrong. Please try again later.",
        description: siteWorksError,
        variant: "destructive",
      });
    }
  }, [siteWorksError]);
  return (
    <div className="max-w-6xl mx-auto md:px-4 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="md:p-8 pt-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-text-primary mb-4">
              Site Visit Documentation
            </h2>
            <p className="text-text-secondary text-lg">
              Document site areas and subareas with detailed measurements and notes
            </p>
          </div>
          {/* Site Areas */}
          <div className="space-y-1">
            {data.siteAreas.map((area: any, areaIdx: number) => (
              <div key={area.id} className="bg-gray-100 rounded-2xl shadow p-2 md:p-8 mb-8 relative">
                {siteWorksLoading === 'pending' && (
                  <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/60 bg-opacity-80 rounded-2xl">
                    <Loader size="xs" />
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Area fields left column */}
                  <div className="md:w-2/5 w-full flex flex-col gap-4 bg-gray-100 text-white rounded-xl p-6 shadow-md relative">
                    {/* Remove Area button top right */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 z-10 w-8 h-8 p-0 rounded-full flex items-center justify-center shadow-md border-0 bg-white text-primary-dark hover:bg-primary-dark hover:text-white transition-colors"
                      onClick={() => {
                        const updated = { siteAreas: data.siteAreas.filter((_: unknown, i: number) => i !== areaIdx) };
                        onUpdate(updated);
                        dispatch(setSiteVisit(updated));
                        // For remove area, just use currentSiteTimeline
                        dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: currentSiteWorks, Missing: [], GeneralTimeline: currentSiteTimeline } });
                        // Remove all works for this area only
                        dispatch(resetSiteWorks({ area: area.name }));
                      }}
                      aria-label="Remove Area"
                    >
                      <span className="sr-only">Remove Area</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={area.name?.replace(new RegExp(`^Area no. ${areaIdx + 1} ?`), '') || ''}
                        onChange={e => {
                          const newName = e.target.value;
                          onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, name: newName } : a) });
                          dispatch(resetSiteWorks({ area: area.name }));
                        }}
                        onBlur={e => {
                          const newName = e.target.value;
                          const fullName = `Area no. ${areaIdx + 1} ${newName}`.trim();
                          const updated = { siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, name: fullName } : a) };
                          onUpdate(updated);
                          dispatch(setSiteVisit(updated));
                          dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: currentSiteWorks, Missing: [], GeneralTimeline: null } });
                        }}
                        className="border-0 border-b border-gray-800 text-xl font-semibold text-gray-900 bg-transparent rounded-none px-2 py-1 placeholder-gray-400 focus:border-b-2 focus:border-gray-900 focus:ring-0"
                        placeholder="Area name"
                        style={{ width: '200px', marginLeft: 0 }}
                      />
                    </div>
                    <Input
                      value={area.statusDescription || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, statusDescription: e.target.value } : a) })}
                      onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                        const updatedAreas = data.siteAreas.map((a, i) => i === areaIdx ? { ...a, statusDescription: e.target.value } : a);
                        const areaData = collectAllAreaAndSubareaFields([updatedAreas[areaIdx]])[0];
                        const formatted = formatAreaData(areaData);
                        const worksResult = await dispatch(fetchSiteWorks(formatted)).unwrap();
                        const filteredWorks = currentSiteWorks.filter((w: any) => w.Area !== areaData.name);
                        const mergedWorks = [...filteredWorks, ...(worksResult.Works || [])];
                        dispatch(setSiteVisit({ siteAreas: updatedAreas }));
                        dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: mergedWorks, Missing: worksResult.Missing || [], GeneralTimeline: worksResult.GeneralTimeline || null } });
                      }}
                      className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                      style={{ '--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                      placeholder="Area status description"
                    />
                    <Input
                      value={area.whatToDo || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, whatToDo: e.target.value } : a) })}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => dispatch(setSiteVisit({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, whatToDo: e.target.value } : a) }))}
                      className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                      style={{ '--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                      placeholder="What to do?"
                    />
                    <div className="flex gap-2 w-full">
                      <Input
                        value={area.totalArea || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, totalArea: e.target.value } : a) })}
                        onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                          if (!e.target.value) return;
                          const updatedAreas = data.siteAreas.map((a, i) => i === areaIdx ? { ...a, totalArea: e.target.value } : a);
                          const areaData = collectAllAreaAndSubareaFields([updatedAreas[areaIdx]])[0];
                          const formatted = formatAreaData(areaData);
                          const worksResult = await dispatch(fetchSiteWorks(formatted)).unwrap();
                          const filteredWorks = currentSiteWorks.filter((w: any) => w.Area !== areaData.name);
                          const mergedWorks = [...filteredWorks, ...(worksResult.Works || [])];
                          dispatch(setSiteVisit({ siteAreas: updatedAreas }));
                          dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: mergedWorks, Missing: worksResult.Missing || [], GeneralTimeline: worksResult.GeneralTimeline || null } });
                        }}
                        className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900 w-1/25"
                        style={{ '--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                        placeholder="Dimensions / Quantity"
                      />
                      <Input
                        value={area.udm || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, udm: e.target.value } : a) })}
                        onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                          if (!e.target.value) return;
                          const updatedAreas = data.siteAreas.map((a, i) => i === areaIdx ? { ...a, udm: e.target.value } : a);
                          const areaData = collectAllAreaAndSubareaFields([updatedAreas[areaIdx]])[0];
                          const formatted = formatAreaData(areaData);
                          const worksResult = await dispatch(fetchSiteWorks(formatted)).unwrap();
                          const filteredWorks = currentSiteWorks.filter((w: any) => w.Area !== areaData.name);
                          const mergedWorks = [...filteredWorks, ...(worksResult.Works || [])];
                          dispatch(setSiteVisit({ siteAreas: updatedAreas }));
                          dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: mergedWorks, Missing: worksResult.Missing || [], GeneralTimeline: worksResult.GeneralTimeline || null } });
                        }}
                        className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900 w-1/3"
                        style={{ '--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                        placeholder="UDM"
                      />
                    </div>
                    {/* End two-column input row */}
                    <div className="flex flex-col gap-2 items-start">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="cursor-pointer rounded-full px-4 py-2 border-none bg-white/90 text-primary-dark font-semibold"
                          asChild
                          disabled={areaPlanLoading}
                        >
                          <label className={areaPlanLoading ? 'opacity-60 pointer-events-none' : ''}>
                            Upload area plan
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setAreaPlanLoading(true);
                                const isPDF = file.type === 'application/pdf';
                                const isImage = file.type.startsWith('image/');
                                const reader = new FileReader();
                                reader.onload = async ev => {
                                  const url = typeof ev.target?.result === 'string' ? ev.target.result : '';
                                  let extractedText = '';
                                  if (isPDF) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const resp = await fetch(`${API_BASE_URL}/extract_pdf_text`, { method: 'POST', body: formData });
                                    const data = await resp.json();
                                    extractedText = data.text || '';
                                  } else if (isImage) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const resp = await fetch(`${API_BASE_URL}/analyze_image_moondream?ocr=true`, { method: 'POST', body: formData });
                                    const data = await resp.json();
                                    extractedText = data.answer || '';
                                  }
                                  const updated = { siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, floorAttachments: [...(a.floorAttachments || []), { url, name: file.name, extractedText }] } : a) };
                                  onUpdate(updated);
                                  dispatch(setSiteVisit(updated));
                                  setAreaPlanLoading(false);
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </Button>
                        {areaPlanLoading && <Loader size="xxs" />}
                      </div>
                      {/* Show uploaded area plan files as links */}
                      {area.floorAttachments && area.floorAttachments.length > 0 && (
                        <div className="flex flex-col gap-1 mt-2">
                          {area.floorAttachments.map((att: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 text-sm">
                                {att.name ? att.name : `Attachment ${i + 1}`}
                              </a>
                              {att.extractedText && (
                                <button
                                  type="button"
                                  className="ml-2 p-1 rounded-full text-primary-dark hover:bg-primary-dark hover:text-white focus:outline-none transition-colors"
                                  aria-label="Show extracted text"
                                  onClick={() => setShowExtractedTextModal({ open: true, text: att.extractedText! })}
                                >
                                  <SearchCheck className="w-5 h-5" />
                                </button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1 p-1 rounded-full text-primary-dark hover:bg-primary-dark hover:text-white focus:outline-none transition-colors"
                                aria-label="Remove attachment"
                                onClick={() => {
                                  const updated = {
                                    siteAreas: data.siteAreas.map((a: any, areaI: number) =>
                                      areaI === areaIdx
                                        ? { ...a, floorAttachments: a.floorAttachments.filter((_: any, attI: number) => attI !== i) }
                                        : a
                                    )
                                  };
                                  onUpdate(updated);
                                  dispatch(setSiteVisit(updated));
                                }}
                              >
                                <span className="sr-only">Remove attachment</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      value={area.attachmentNote || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, attachmentNote: e.target.value } : a) })}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => dispatch(setSiteVisit({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, attachmentNote: e.target.value } : a) }))}
                      className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                      style={{ '--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                      placeholder="Attachment comment (optional)"
                    />

                  </div>
                  {/* Subareas right column */}
                  <div className="md:w-3/5 w-full flex flex-col gap-6 items-center">
                    {area.subareas?.map((sub: any, subIdx: number) => (
                      <div key={sub.id} className="bg-white rounded-2xl w-full p-4 md:p-6 border border-gray-200 relative">
                        <div className="flex items-center gap-2 mb-2 justify-between">
                          <Input
                            value={sub.title?.replace(new RegExp(`^Subarea no. ${subIdx + 1} ?`), '') || ''}
                            data-area-idx={areaIdx}
                            data-sub-idx={subIdx}
                            onChange={e => {
                              const newTitle = e.target.value;
                              const updated = {
                                siteAreas: data.siteAreas.map((a, i) =>
                                  i === areaIdx
                                    ? {
                                        ...a,
                                        subareas: a.subareas.map((s, si) =>
                                          si === subIdx ? { ...s, title: newTitle } : s
                                        ),
                                      }
                                    : a
                                ),
                              };
                              onUpdate(updated);
                            }}
                            onBlur={async e => {
                              const newTitle = e.target.value;
                              const fullTitle = `Subarea no. ${subIdx + 1} ${newTitle}`.trim();
                              const updated = {
                                siteAreas: data.siteAreas.map((a, i) =>
                                  i === areaIdx
                                    ? {
                                        ...a,
                                        subareas: a.subareas.map((s, si) =>
                                          si === subIdx ? { ...s, title: fullTitle } : s
                                        ),
                                      }
                                    : a
                                ),
                              };
                              onUpdate(updated);
                              dispatch(setSiteVisit(updated));
                              // Fetch site works for this area/subarea
                              const areaData = collectAllAreaAndSubareaFields([updated.siteAreas[areaIdx]])[0];
                              const formatted = formatAreaData(areaData);
                              const worksResult = await dispatch(fetchSiteWorks(formatted)).unwrap();
                              const filteredWorks = currentSiteWorks.filter((w: any) => w.Area !== areaData.name);
                              const mergedWorks = [...filteredWorks, ...(worksResult.Works || [])];
                              dispatch(setSiteVisit({ siteAreas: updated.siteAreas }));
                              dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: mergedWorks, Missing: worksResult.Missing || [], GeneralTimeline: worksResult.GeneralTimeline || null } });
                            }}
                            className="border-0 border-b border-gray-800 text-lg font-semibold text-gray-800 bg-white rounded-none px-2 py-1 placeholder-gray-400 focus:border-b-2 focus:border-gray-900 focus:ring-0"
                            placeholder="Subarea name"
                            style={{ width: '180px', marginLeft: 0 }}
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            className="w-8 h-8 p-0 rounded-full flex items-center justify-center shadow-md border-0 bg-white text-primary-dark hover:bg-primary-dark hover:text-white transition-colors z-10"
                            onClick={() => {
                              const updated = {
                                siteAreas: data.siteAreas.map((a: any, i: number) =>
                                  i === areaIdx
                                    ? { ...a, subareas: a.subareas.filter((_: any, si: number) => si !== subIdx) }
                                    : a
                                )
                              };
                              onUpdate(updated);
                              dispatch(setSiteVisit(updated));
                              // For remove subarea, just use currentSiteTimeline
                              dispatch({ type: 'siteWorks/setSiteWorks', payload: { SiteWorks: currentSiteWorks, Missing: [], GeneralTimeline: currentSiteTimeline } });
                              // Remove only works for this subarea in this area
                              dispatch(resetSiteWorks({ area: area.name, subarea: sub.title }));
                            }}
                            aria-label="Remove Subarea"
                          >
                            <span className="sr-only">Remove Subarea</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                        <SubareaCard
                          sub={sub}
                          areaIdx={areaIdx}
                          subIdx={subIdx}
                          onUpdate={handleUpdate}
                          data={data}
                          setGeneratingDesc={() => { }}
                        />
                        {/* Notification Progress Bar under each subarea */}
                        <NotificationProgressBar areaName={area.name} subareaTitle={sub.title} />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => handleAddSubarea(area.id)}
                      className="w-[300px] max-w-md border border-dashed border-primary text-primary hover:bg-primary hover:text-white rounded-xl py-4 px-6 text-md shadow transition-all"
                      data-testid={`button-add-subarea-${area.id}`}
                    >
                      Add New Subarea
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center items-center mt-4">
              <Button
                variant="outline"
                onClick={handleAddArea}
                className="w-[340px] max-w-full border border-dashed border-primary text-primary hover:bg-primary hover:text-white rounded-xl py-6 px-16 text-lg shadow transition-all"
                data-testid="button-add-area"
              >
                Add New Area
              </Button>
            </div>
          </div>
          {/* General Notes and Attachments - always at the bottom */}
          <div className="bg-white/90 rounded-2xl shadow px-8 py-2 mt-12">
            <h3 className="text-lg font-semibold mb-3">General Notes & Attachments</h3>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left column: General Notes */}
              <div className="flex-1 mb-4 md:mb-0">
                <Input
                  value={generalNotes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralNotes(e.target.value)}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const updated = { generalNotes: e.target.value };
                    onUpdate(updated);
                    dispatch(setSiteVisit(updated));
                  }}
                  className="text-base py-2 px-3 w-full"
                  placeholder="General notes about the project, requirements, or constraints..."
                />
              </div>
              {/* Right column: Attachments */}
              <div className="flex-1 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setAttachmentPopover((v) => !v)}
                    disabled={generalAttachmentLoading}
                    className={generalAttachmentLoading ? 'opacity-60 pointer-events-none' : ''}
                  >
                    <Upload className="h-5 w-5 mr-2" /> Attach files
                  </Button>
                  {generalAttachmentLoading && <Loader size="xxs" />}
                </div>
                {attachmentPopover && (
                  <div className="absolute left-0 top-full mt-2 z-50 bg-white border rounded-xl shadow-lg p-4 flex flex-col gap-2 min-w-[12rem]">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (pdfInputRef.current) pdfInputRef.current.value = "";
                        pdfInputRef.current?.click();
                      }}
                    >
                      <FileText className="h-5 w-5" /> Upload PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (imageInputRef.current) imageInputRef.current.value = "";
                        imageInputRef.current?.click();
                      }}
                    >
                      <ImageIcon className="h-5 w-5" /> Upload Image
                    </Button>
                    {/* Hidden file inputs */}
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      onChange={async e => {
                        setAttachmentPopover(false);
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setGeneralAttachmentLoading(true);
                        const reader = new FileReader();
                        reader.onload = async ev => {
                          const url = typeof ev.target?.result === 'string' ? ev.target.result : '';
                          const formData = new FormData();
                          formData.append('file', file);
                          const resp = await fetch(`${API_BASE_URL}/extract_pdf_text`, { method: 'POST', body: formData });
                          const data = await resp.json();
                          const newAttachment = { url, title: '', extractedText: data.text || '' };
                          setGeneralAttachments(prev => {
                            const updated = [...prev, newAttachment];
                            onUpdate({ generalAttachments: updated });
                            dispatch(setSiteVisit({ generalAttachments: updated }));
                            setGeneralAttachmentLoading(false);
                            return updated;
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async e => {
                        setAttachmentPopover(false);
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setGeneralAttachmentLoading(true);
                        const reader = new FileReader();
                        reader.onload = async ev => {
                          const url = typeof ev.target?.result === 'string' ? ev.target.result : '';
                          setGeneralAttachments(prev => {
                            const updated = [...prev, { url, title: '', extractedText: '' }];
                            onUpdate({ generalAttachments: updated });
                            dispatch(setSiteVisit({ generalAttachments: updated }));
                            setGeneralAttachmentLoading(false);
                            return updated;
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2 flex-wrap">
                  {generalAttachments.map((att: { url: string; title: string; extractedText?: string }, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <Input
                        value={att.title || ''}
                        onChange={e => {
                          const newAttachments = generalAttachments.map((a, idx) =>
                            idx === i ? { ...a, title: e.target.value } : a
                          );
                          setGeneralAttachments(newAttachments);
                        }}
                        onBlur={async e => {
                          const newTitle = e.target.value;
                          let newAttachments = generalAttachments.map((a, idx) =>
                            idx === i ? { ...a, title: newTitle } : a
                          );
                          const isImage = att.url.startsWith('data:image');
                          if (isImage && newTitle) {
                            setGeneralAttachmentLoading(true);
                            try {
                              const res = await fetch(att.url);
                              const blob = await res.blob();
                              const formData = new FormData();
                              formData.append('file', blob, `attachment_${i}.png`);
                              const resp = await fetch(`${API_BASE_URL}/analyze_image_moondream?notes=${encodeURIComponent(newTitle)}`, { method: 'POST', body: formData });
                              const data = await resp.json();
                              newAttachments = newAttachments.map((a, idx) =>
                                idx === i ? { ...a, extractedText: data.answer || '' } : a
                              );
                            } catch (err) { /* ignore */ }
                            setGeneralAttachmentLoading(false);
                          }
                          onUpdate({ generalAttachments: newAttachments });
                          dispatch(setSiteVisit({ generalAttachments: newAttachments }));
                          setGeneralAttachments(newAttachments);
                        }}
                        className="text-sm py-1 px-2 w-48"
                        placeholder="Document title"
                      />
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 text-sm">
                        Attachment {i + 1}
                      </a>
                      {att.extractedText && (
                        <button
                          type="button"
                          className="ml-2 p-1 rounded-full bg-white text-primary-dark hover:bg-primary-dark hover:text-white focus:outline-none transition-colors"
                          aria-label="Show extracted text"
                          onClick={() => setShowExtractedTextModal({ open: true, text: att.extractedText! })}
                        >
                          <SearchCheck className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="ml-1 p-1 rounded-full bg-white text-primary-dark hover:bg-primary-dark hover:text-white focus:outline-none transition-colors"
                        aria-label="Remove attachment"
                        onClick={() => {
                          const updated = generalAttachments.filter((_, idx) => idx !== i);
                          setGeneralAttachments(updated);
                          onUpdate({ generalAttachments: updated });
                          dispatch(setSiteVisit({ generalAttachments: updated }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Modal for extracted text */}
                  {showExtractedTextModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full relative">
                        <button
                          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200"
                          onClick={() => setShowExtractedTextModal({ open: false, text: "" })}
                          aria-label="Close"
                          style={{ background: 'none' }}
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <h4 className="text-lg font-semibold mb-4">Extracted Information</h4>
                        <div className="whitespace-pre-wrap text-gray-800 text-base max-h-[60vh] overflow-y-auto">
                          {showExtractedTextModal.text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* AI Consent Checkbox */}
          <div className="flex items-center mt-6 ml-4">
            <Checkbox
              id="ai-consent"
              checked={aiConsent}
              onCheckedChange={(checked: boolean) => {
                setAiConsent(checked);
                onUpdate({ aiConsent: checked });
                dispatch(setSiteVisit({ aiConsent: checked }));
              }}
              className="mr-3 w-5 h-5 border-2 border-primary rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="ai-consent" className="text-sm text-gray-700 select-none">
              I agree AI use in processing of uploaded documents and photos for the construction inspection and analysis.
            </label>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-between mt-10">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary text-lg px-8 py-4 rounded-full"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => {
                // Collect all area and subarea info from redux
                const allData = collectAllAreaAndSubareaFields(siteVisitState.siteAreas || []);
                onNext();
              }}
              variant="link"
              className="text-lg px-8 py-4 rounded-full"
              data-testid="button-continue"
              disabled={!siteWorksLength}
            >
              <span className="hidden md:inline">Continue to Activity Overview</span>
              <span className="inline md:hidden">Continue</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
