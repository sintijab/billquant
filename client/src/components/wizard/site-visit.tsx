import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Upload,
  MapPin,
  Home,
  Ruler
} from "lucide-react";
import { ProjectWizardData } from "@/lib/types";

interface SiteVisitProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function SiteVisit({ data, onUpdate, onNext, onPrevious }: SiteVisitProps) {
  const [editingArea, setEditingArea] = useState<string | null>(null);

  const handleAddArea = () => {
    const newArea = {
      id: `area-${Date.now()}`,
      name: "New Area",
      totalArea: "0",
      status: "To be assessed",
      priority: "medium" as const,
      subareas: []
    };
    
    onUpdate({
      siteAreas: [...data.siteAreas, newArea]
    });
  };

  const handleAddSubarea = (areaId: string) => {
    const newSubarea = {
      id: `subarea-${Date.now()}`,
      name: "New Room",
      dimensions: "0m × 0m",
      area: "0",
      height: "0",
      volume: "0",
      currentStatus: "",
      workRequired: "",
      photos: []
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Site Visit Documentation</h2>
            <p className="text-text-secondary text-lg">
              Document site areas and subareas with detailed measurements and notes
            </p>
          </div>

          {/* Sample Site Areas */}
          <div className="space-y-8">
            {/* Default Piano Terra Area */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 inline-block">
                  Piano Terra
                </h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-text-primary">Total Area:</span>
                    <span className="text-text-secondary ml-2">120 m²</span>
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">Status:</span>
                    <span className="text-text-secondary ml-2">To be renovated</span>
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">Priority:</span>
                    <Badge variant="destructive" className="ml-2">High</Badge>
                  </div>
                </div>
              </div>

              {/* Subareas */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-text-primary flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Subareas
                </h4>
                
                {/* Soggiorno Subarea */}
                <div className="bg-surface-light rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-text-primary">Soggiorno</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="button-edit-soggiorno"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium">Dimensions:</span>
                      <div className="text-text-secondary">6.5m × 4.2m</div>
                    </div>
                    <div>
                      <span className="font-medium">Area:</span>
                      <div className="text-text-secondary">27.3 m²</div>
                    </div>
                    <div>
                      <span className="font-medium">Height:</span>
                      <div className="text-text-secondary">3.0m</div>
                    </div>
                    <div>
                      <span className="font-medium">Volume:</span>
                      <div className="text-text-secondary">81.9 m³</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="font-medium text-sm">Current Status:</span>
                    <p className="text-text-secondary text-sm mt-1">
                      Existing wood flooring to be removed. Walls need new paint. Electrical system requires upgrade.
                    </p>
                  </div>
                  <div className="mb-4">
                    <span className="font-medium text-sm">Work Required:</span>
                    <p className="text-text-secondary text-sm mt-1">
                      Remove existing flooring, install new ceramic tiles, repaint walls, upgrade electrical outlets.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <img 
                      src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=80" 
                      alt="Living room current state" 
                      className="w-20 h-16 object-cover rounded"
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=80" 
                      alt="Living room electrical detail" 
                      className="w-20 h-16 object-cover rounded"
                    />
                    <button 
                      className="w-20 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors"
                      data-testid="button-add-photo"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Cucina Subarea */}
                <div className="bg-surface-light rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-text-primary">Cucina</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="button-edit-cucina"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium">Dimensions:</span>
                      <div className="text-text-secondary">4.0m × 3.5m</div>
                    </div>
                    <div>
                      <span className="font-medium">Area:</span>
                      <div className="text-text-secondary">14.0 m²</div>
                    </div>
                    <div>
                      <span className="font-medium">Height:</span>
                      <div className="text-text-secondary">3.0m</div>
                    </div>
                    <div>
                      <span className="font-medium">Volume:</span>
                      <div className="text-text-secondary">42.0 m³</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="font-medium text-sm">Current Status:</span>
                    <p className="text-text-secondary text-sm mt-1">
                      Old kitchen units to be removed. Plumbing and electrical systems need complete renewal.
                    </p>
                  </div>
                  <div className="mb-4">
                    <span className="font-medium text-sm">Work Required:</span>
                    <p className="text-text-secondary text-sm mt-1">
                      Full kitchen renovation: new units, countertops, appliances, plumbing, and electrical work.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <img 
                      src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=80" 
                      alt="Kitchen current state" 
                      className="w-20 h-16 object-cover rounded"
                    />
                    <button 
                      className="w-20 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors"
                      data-testid="button-add-kitchen-photo"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleAddSubarea("piano-terra")}
                  className="w-full border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white"
                  data-testid="button-add-subarea"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Subarea
                </Button>
              </div>
            </div>

            {/* Additional Areas */}
            {data.siteAreas.map((area) => (
              <div key={area.id} className="border border-gray-200 rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 inline-block">
                    {area.name}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-text-primary">Total Area:</span>
                      <span className="text-text-secondary ml-2">{area.totalArea} m²</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Status:</span>
                      <span className="text-text-secondary ml-2">{area.status}</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Priority:</span>
                      <Badge 
                        variant={area.priority === "high" ? "destructive" : area.priority === "medium" ? "default" : "secondary"} 
                        className="ml-2"
                      >
                        {area.priority.charAt(0).toUpperCase() + area.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handleAddSubarea(area.id)}
                  className="w-full border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white"
                  data-testid={`button-add-subarea-${area.id}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Subarea
                </Button>
              </div>
            ))}

            {/* General Notes and Attachments */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                General Notes and Attachments
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectNotes" className="block text-sm font-medium text-text-primary mb-2">
                    Project Notes
                  </Label>
                  <Textarea
                    id="projectNotes"
                    placeholder="Add any additional notes about the project, special requirements, or constraints..."
                    value={data.generalNotes}
                    onChange={(e) => onUpdate({ generalNotes: e.target.value })}
                    className="h-32 resize-none"
                    data-testid="textarea-project-notes"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-text-primary mb-2">
                    Additional Attachments
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-text-secondary mb-3">Drop files here or click to upload</p>
                    <Button 
                      variant="outline" 
                      className="bg-surface-light hover:bg-gray-200"
                      data-testid="button-choose-files"
                    >
                      Choose Files
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleAddArea}
              className="w-full border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white"
              data-testid="button-add-area"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Area
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project Setup
            </Button>
            <Button 
              onClick={onNext} 
              className="btn-primary"
              data-testid="button-continue"
            >
              Continue to Activities Overview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
