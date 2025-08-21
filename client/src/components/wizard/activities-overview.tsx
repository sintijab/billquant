import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Hammer,
  Settings,
  PaintBucket,
  Calendar,
  Clock
} from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import { useSelector } from 'react-redux';
import React, { useState } from 'react';

interface ActivitiesOverviewProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ActivitiesOverview({ data, onUpdate, onNext, onPrevious }: ActivitiesOverviewProps) {

  // Get siteWorks from Redux
  const siteWorks = useSelector((state: any) => state.siteWorks);
  const works = siteWorks.Works || [];
  const timeline = siteWorks.GeneralTimeline?.Activities || [];

  // Group works by Work (name)
  const grouped = works.reduce((acc: any, work: any) => {
    if (!acc[work.Work]) acc[work.Work] = [];
    acc[work.Work].push(work);
    return acc;
  }, {});

  // State to track which timeline activities are expanded
  const [expanded, setExpanded] = useState<{ [activity: string]: boolean }>({});

  // Helper to toggle expanded state
  const toggleExpanded = (activity: string) => {
    setExpanded((prev) => ({ ...prev, [activity]: !prev[activity] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="lg:p-8">
          <div className="md:mb-8 text-center p-4">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Planned Work Activities</h2>
            <p className="text-text-secondary text-lg">
              Overview the construction activitiy summary based on your site visit.
            </p>
          </div>
            {/* Timeline Summary from GeneralTimeline */}
          <div className="md:mt-8 bg-surface-light rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-primary mr-2" />
              <span>Estimated Timeline for </span>
              {timeline.length > 0 && (() => {
                const minStart = Math.min(...timeline.map((a: any) => a.Starting));
                const maxFinish = Math.max(...timeline.map((a: any) => a.Finishing));
                const totalSpan = maxFinish - minStart;
                return (
                  <span className="pl-1">{totalSpan} days</span>
                );
              })()}
            </h3>
            {/* Progress Bar Timeline with expandable tables */}
            <div className="w-full flex flex-col gap-4">
              {(() => {
                if (!timeline.length) return null;
                // Find min start and max finish
                const minStart = Math.min(...timeline.map((a: any) => a.Starting));
                const maxFinish = Math.max(...timeline.map((a: any) => a.Finishing));
                const totalSpan = maxFinish - minStart;
                return timeline.map((activity: any, idx: number) => {
                  const start = activity.Starting;
                  const end = activity.Finishing;
                  const duration = end - start;
                  const offset = start - minStart;
                  const percentOffset = (offset / (totalSpan || 1)) * 100;
                  const percentWidth = (duration / (totalSpan || 1)) * 100;
                  // Find all works matching this activity.Activity as Work
                  const matchingWorks = works.filter((w: any) => {
                    if (!w.Work || !activity.Activity) return false;
                    const workWords = w.Work.split(/\s+/).map((word: string) => word.toLowerCase());
                    const activityWords = activity.Activity.split(/\s+/).map((word: string) => word.toLowerCase());
                    const common = workWords.filter((word: string) => activityWords.includes(word));
                    return common.length >= 3;
                  });
                  return (
                    <div key={idx} className="flex flex-col w-full mb-4">
                      <div className="flex flex-row items-center w-full text-base text-text-secondary mb-1 px-1">
                        {/* Mobile: title is clickable, Desktop: show more link next to title */}
                        <span
                          className={`font-semibold text-text-primary text-left truncate flex items-center ${matchingWorks.length > 0 ? 'cursor-pointer underline md:no-underline' : ''} md:cursor-default`}
                          onClick={() => {
                            if (window.innerWidth < 768 && matchingWorks.length > 0) toggleExpanded(activity.Activity);
                          }}
                          tabIndex={matchingWorks.length > 0 ? 0 : -1}
                          role={matchingWorks.length > 0 ? 'button' : undefined}
                          aria-expanded={expanded[activity.Activity]}
                        >
                          {activity.Activity}
                          {/* Desktop only: Show more/Hide link */}
                          {matchingWorks.length > 0 && (
                            <button
                              className="ml-3 text-primary underline text-xs font-medium focus:outline-none hidden md:inline"
                              onClick={e => { e.stopPropagation(); toggleExpanded(activity.Activity); }}
                            >
                              {expanded[activity.Activity] ? 'Hide' : 'Show more'}
                            </button>
                          )}
                        </span>
                        <span className="ml-4 flex-1 text-right text-text-secondary whitespace-nowrap flex items-center justify-end">
                          <Clock className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                          1 {activity.Finishing - activity.Starting > 1 ? " - " + (activity.Finishing - activity.Starting) : ""} {activity.Finishing - activity.Starting > 1 ? "days" : "day"}
                        </span>
                      </div>
                      <div className="w-full relative h-5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{
                            left: `${percentOffset}%`,
                            width: 0,
                            minWidth: '2%',
                            background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                            opacity: 0.95,
                            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                          }}
                          ref={el => {
                            if (el) {
                              setTimeout(() => {
                                el.style.width = `${percentWidth}%`;
                              }, 50);
                            }
                          }}
                        ></div>
                      </div>
                      {/* Expandable table for matching works */}
                      {expanded[activity.Activity] && matchingWorks.length > 0 && (
                        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-surface-light p-4">
                            <h4 className="text-base font-semibold text-text-primary">
                              Construction activities for {matchingWorks[0]?.Area}
                            </h4>
                          </div>
                          {/* Responsive Table: Desktop shows table, mobile shows cards */}
                          <div>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-2/5">
                                      Work
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-1/5">
                                      Location
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-1/5">
                                      Quantity
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-1/5">
                                      UDM
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {matchingWorks.map((w: any, widx: number) => (
                                    <tr key={widx} className="hover:bg-surface-light transition-colors">
                                      <td className="px-4 py-4 text-sm text-text-primary w-2/5">
                                        <span className="text-lg font-semibold text-text-primary flex items-center">
                                          {w.Work}
                                        </span>
                                        <div className="text-sm text-text-secondary mt-1">{w.Timeline}</div>
                                      </td>
                                      <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                                        {w.Subarea}
                                      </td>
                                      <td className="px-4 py-4 text-sm text-text-primary font-medium w-1/5 text-center">
                                        {w.Quantity}
                                      </td>
                                      <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                                        {w.Unit}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {/* Mobile Cards */}
                            <div className="md:hidden flex flex-col gap-3">
                              {matchingWorks.map((w: any, widx: number) => (
                                <div key={widx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                  <div className="text-lg font-semibold text-text-primary mb-1">{w.Work}</div>
                                  <div className="text-sm text-text-secondary mb-2">{w.Timeline}</div>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-medium text-text-secondary">Location</span>
                                      <span className="text-text-primary">{w.Subarea}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="font-medium text-text-secondary">Quantity</span>
                                      <span className="text-text-primary">{w.Quantity}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="font-medium text-text-secondary">UDM</span>
                                      <span className="text-text-primary">{w.Unit}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:hidden flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Site Visit
            </Button>
            <Button 
              onClick={onNext} 
              className="btn-primary"
              data-testid="button-continue"
            >
              Continue to Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
                    <div className="hidden md:flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Site Visit
            </Button>
            <Button 
              onClick={onNext} 
              className="btn-primary"
              data-testid="button-continue"
            >
              Continue to Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
