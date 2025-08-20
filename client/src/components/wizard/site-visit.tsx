
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import SubareaCard from "./subarea-card";


interface SiteVisitProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}


export default function SiteVisit({ data, onUpdate, onNext, onPrevious }: SiteVisitProps) {
  const [generalNotes, setGeneralNotes] = useState(data.generalNotes || "");
  const [documentTitle, setDocumentTitle] = useState("");
  const [generalAttachments, setGeneralAttachments] = useState<any[]>([]);

  const handleAddArea = () => {
    const newArea = {
      id: `area-${Date.now()}`,
      name: "New Area",
      statusDescription: "",
      whatToDo: "",
      dimensions: "",
      udm: "",
      quantity: "",
      attachmentNote: "",
      floorAttachments: [],
      subareas: [],
      // Required fields for SiteArea type
      totalArea: "",
      status: "",
  priority: "medium" as "medium"
    };
    onUpdate({ siteAreas: [...data.siteAreas, newArea] });
  };

  const handleAddSubarea = (areaId: string) => {
    const newSubarea = {
      id: `subarea-${Date.now()}`,
      name: "New Subarea",
      statusDescription: "",
      dimensions: "",
      udm: "",
      quantity: "",
      photos: [],
      // Required fields for SiteSubarea type
      area: "",
      height: "",
      volume: "",
      currentStatus: "",
      workRequired: ""
    };
    onUpdate({
      siteAreas: data.siteAreas.map(area =>
        area.id === areaId
          ? { ...area, subareas: [...area.subareas, newSubarea] }
          : area
      )
    });
  };


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
              <div key={area.id} className="bg-gray-100 rounded-2xl shadow p-5 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Area fields left column */}
                  <div className="md:w-2/5 w-full flex flex-col gap-4 bg-gray-100 text-white rounded-xl p-6 shadow-md relative">
                    {/* Remove Area button top right */}
                    <Button 
                      variant="outline"
                      size="icon" 
                      className="absolute top-2 right-2 z-10 w-8 h-8 p-0 rounded-full flex items-center justify-center shadow-md border-0 bg-white text-primary-dark hover:bg-primary-dark hover:text-white transition-colors"
                      onClick={() => onUpdate({ siteAreas: data.siteAreas.filter((_, i) => i !== areaIdx) })}
                      aria-label="Remove Area"
                    >
                      <span className="sr-only">Remove Area</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                    {area.name === 'New Area' ? (
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">New Area</h2>
                    ) : (
                      <Input
                        value={area.name}
                        onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, name: e.target.value } : a) })}
                        className="text-lg font-semibold bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                        style={{'--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                        placeholder="Area name"
                      />
                    )}
                    <Input
                      value={area.statusDescription || ''}
                      onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, statusDescription: e.target.value } : a) })}
                      className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                      style={{'--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                      placeholder="Area status description"
                    />
                    <Input
                      value={area.whatToDo || ''}
                      onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, whatToDo: e.target.value } : a) })}
                      className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                      style={{'--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                      placeholder="What to do?"
                    />
                    <Input
                      value={area.dimensions || ''}
                      onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, dimensions: e.target.value } : a) })}
                      className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                      style={{'--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                      placeholder="Dimensions"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={area.udm || ''}
                        onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, udm: e.target.value } : a) })}
                        className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                        style={{'--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                        placeholder="UDM"
                      />
                      <Input
                        value={area.quantity || ''}
                        onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a, i) => i === areaIdx ? { ...a, quantity: e.target.value } : a) })}
                        className="bg-transparent border-0 border-b-2 border-white focus:ring-0 focus:border-white rounded-none px-0 placeholder-white text-gray-900"
                        style={{'--tw-placeholder-opacity': '1', color: '#222', colorScheme: 'dark', '::placeholder': { color: '#fff', opacity: 1 } } as any}
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                      <Button variant="outline" className="cursor-pointer rounded-full px-4 py-2 border-none bg-white/90 text-primary-dark font-semibold" asChild>
                        <label>
                          Upload area plan
                          <input type="file" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => {
                                onUpdate({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, floorAttachments: [...(a.floorAttachments || []), { url: ev.target?.result, name: file.name }] } : a) });
                              };
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                      </Button>
                      {/* Show uploaded area plan files as links */}
                      {area.floorAttachments && area.floorAttachments.length > 0 && (
                        <div className="flex flex-col gap-1 mt-2">
                          {area.floorAttachments.map((att: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 text-sm">
                                {att.name ? att.name : `Attachment ${i+1}`}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      value={area.attachmentNote || ''}
                      onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, attachmentNote: e.target.value } : a) })}
                      className="bg-white/80 placeholder:text-gray-400"
                      placeholder="Attachment note (optional)"
                    />

                  </div>
                  {/* Subareas right column */}
                  <div className="md:w-3/5 w-full flex flex-col gap-6">
                    {area.subareas?.map((sub: any, subIdx: number) => (
                      <SubareaCard
                        key={sub.id}
                        sub={sub}
                        areaIdx={areaIdx}
                        subIdx={subIdx}
                        onUpdate={onUpdate}
                        data={data}
                        setGeneratingDesc={() => {}}
                      />
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
            <div className="flex justify-center">
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
                  onChange={e => setGeneralNotes(e.target.value)}
                  className="text-base py-2 px-3 w-full"
                  placeholder="General notes about the project, requirements, or constraints..."
                />
              </div>
              {/* Right column: Attachments */}
              <div className="flex-1">
                <label className="inline-block mb-4">
                  <span className="btn-primary inline-flex items-center px-4 py-2 rounded-full font-semibold cursor-pointer bg-primary text-white hover:bg-primary-dark transition-all shadow border-0">
                    Attach files
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          setGeneralAttachments(prev => [...prev, { url: ev.target?.result, title: '' }]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                  />
                </label>
                <div className="flex flex-col gap-2 flex-wrap">
                  {generalAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <Input
                        value={att.title || ''}
                        onChange={e => {
                          const newAttachments = [...generalAttachments];
                          newAttachments[i].title = e.target.value;
                          setGeneralAttachments(newAttachments);
                        }}
                        className="text-sm py-1 px-2 w-48"
                        placeholder="Document title"
                      />
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 text-sm">Attachment {i+1}</a>
                      <button
                        type="button"
                        className="ml-1 p-1 rounded-full bg-white text-primary-dark hover:bg-primary-dark hover:text-white focus:outline-none transition-colors"
                        aria-label="Remove attachment"
                        onClick={() => setGeneralAttachments(generalAttachments.filter((_, idx) => idx !== i))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              onClick={onNext} 
              className="btn-primary text-lg px-8 py-4 rounded-full shadow"
              data-testid="button-continue"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
