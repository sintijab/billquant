import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  Calendar,
  Clock
} from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import { useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import Loader from '@/components/ui/loader';
import { AppDispatch, RootState } from "@/store";
import { fetchCategoryData } from "@/features/boqSlice";

interface ActivitiesOverviewProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: (nr?: number) => void;
}

export default function ActivitiesOverview({ data, onUpdate, onNext, onPrevious }: ActivitiesOverviewProps) {

  // Get siteWorks from Redux
  const siteWorks = useSelector((state: any) => state.siteWorks);
  const works = siteWorks.Works || [];
  const timeline = siteWorks.GeneralTimeline?.Activities || siteWorks.GeneralTimeline || [];

  const [loading, setLoading] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSequentially = async () => {
      setLoading(true);
      for (const activity of timeline) {
        if (!isMounted) break;
        if (activity.Activity) {
          setLoadingActivity(activity.Activity);
          await dispatch(fetchCategoryData(activity.Activity));
        }
      }
      setLoadingActivity(null);
      setLoading(false);
    };
    if (timeline.length > 0) {
      fetchSequentially();
    }
    return () => { isMounted = false; };
  }, [timeline]);

  // State to track which timeline activities are expanded
  const [expanded, setExpanded] = useState<{ [activity: string]: boolean }>({});

  // Helper to toggle expanded state
  const toggleExpanded = (activity: string) => {
    setExpanded((prev) => ({ ...prev, [activity]: !prev[activity] }));
  };
 const dispatch: AppDispatch = useDispatch();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader size="xs" />
        <span className="text-text-primary text-md mt-2">
          Progettazione dei lavori per la{' '}
          <span className="font-semibold">{loadingActivity}</span>
        </span>
      </div>
    );
  }

  // Check if Area is present in works
  const hasArea = works.length > 0 && 'Area' in works[0] && works[0].Area;
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
          {/* Timeline Summary and tables */}
          {hasArea ? (
            (() => {
              // Group by area as before
              const areaList = Array.from(new Set(works.map((w: any) => w.Area)));
              const areaWorksMap: Record<string, any[]> = {};
              works.forEach((w: any) => {
                if (!areaWorksMap[w.Area]) areaWorksMap[w.Area] = [];
                areaWorksMap[w.Area].push(w);
              });
              const areaTimelineMap: Record<string, any[]> = {};
              timeline.forEach((activity: any, idx: number) => {
                // Find the matching work for this activity by index
                const work = works[idx];
                if (work && work.Area) {
                  if (!areaTimelineMap[work.Area]) areaTimelineMap[work.Area] = [];
                  areaTimelineMap[work.Area].push({ activity, work });
                }
              });
              console.log(areaTimelineMap)
              return areaList.map(area => {
                const areaTimeline = areaTimelineMap[area] || [];
                if (!areaTimeline.length) return null;
                // Find min start and max finish for this area
                const minStart = Math.min(...areaTimeline.map((aw: any) => aw.activity.Starting));
                const maxFinish = Math.max(...areaTimeline.map((aw: any) => aw.activity.Finishing));
                const totalSpan = maxFinish - minStart;
                return (
                  <div key={area} className="md:mt-8 bg-surface-light rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      <span>Estimated Timeline for {area}</span>
                      {areaTimeline.length > 0 && (
                        <span className="pl-1">{totalSpan} days</span>
                      )}
                    </h3>
                    <div className="w-full flex flex-col gap-4">
                      {areaTimeline.map((aw: any, idx: number) => {
                        const activity = aw.activity;
                        const work = aw.work;
                        const start = activity.Starting;
                        const end = activity.Finishing;
                        const duration = end - start;
                        const offset = start - minStart;
                        const percentOffset = (offset / (totalSpan || 1)) * 100;
                        const percentWidth = (duration / (totalSpan || 1)) * 100;
                        return (
                          <div key={idx} className="flex flex-col w-full mb-4">
                            <div className="flex flex-row items-center w-full text-base text-text-secondary mb-1 px-1">
                              <span
                                className={`font-semibold text-text-primary text-left truncate flex items-center cursor-pointer underline md:no-underline md:cursor-default`}
                                onClick={() => {
                                  if (window.innerWidth < 768) toggleExpanded(activity.Activity + area);
                                }}
                                tabIndex={0}
                                role={'button'}
                                aria-expanded={expanded[activity.Activity + area]}
                              >
                                {activity.Activity}
                                <button
                                  className="ml-3 text-primary underline text-xs font-medium focus:outline-none hidden md:inline"
                                  onClick={e => { e.stopPropagation(); toggleExpanded(activity.Activity + area); }}
                                >
                                  {expanded[activity.Activity + area] ? 'Hide' : 'Show more'}
                                </button>
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
                            {expanded[activity.Activity + area] && (
                              <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-surface-light p-4">
                                  <h4 className="text-base font-semibold text-text-primary">
                                    Construction activities for {area}
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
                                        <tr>
                                          <td className="px-4 py-4 text-sm text-text-primary w-2/5">
                                            <span className="text-lg font-semibold text-text-primary flex items-center">
                                              {work.Work}
                                            </span>
                                            <div className="text-sm text-text-secondary mt-1">{work.Timeline}</div>
                                          </td>
                                          <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                                            {work.Subarea}
                                          </td>
                                          <td className="px-4 py-4 text-sm text-text-primary font-medium w-1/5 text-center">
                                            {work.Quantity}
                                          </td>
                                          <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                                            {work.Unit}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  {/* Mobile Cards */}
                                  <div className="md:hidden flex flex-col gap-3">
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                      <div className="text-lg font-semibold text-text-primary mb-1">{work.Work}</div>
                                      <div className="text-sm text-text-secondary mb-2">{work.Timeline}</div>
                                      <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="font-medium text-text-secondary">Location</span>
                                          <span className="text-text-primary">{work.Subarea}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="font-medium text-text-secondary">Quantity</span>
                                          <span className="text-text-primary">{work.Quantity}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="font-medium text-text-secondary">UDM</span>
                                          <span className="text-text-primary">{work.Unit}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          ) : (
            (() => {
              // Flat timeline: no area grouping
              if (!timeline.length) return null;
              const minStart = Math.min(...timeline.map((a: any) => a.Starting));
              const maxFinish = Math.max(...timeline.map((a: any) => a.Finishing));
              const totalSpan = maxFinish - minStart;
              return (
                <div className="md:mt-8 bg-surface-light rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                    <Calendar className="h-5 w-5 text-primary mr-2" />
                    <span>Estimated Timeline</span>
                    {timeline.length > 0 && (
                      <span className="pl-1">{totalSpan} days</span>
                    )}
                  </h3>
                  <div className="w-full flex flex-col gap-4">
                    {timeline.map((activity: any, idx: number) => {
                      const start = activity.Starting;
                      const end = activity.Finishing;
                      const duration = end - start;
                      const offset = start - minStart;
                      const percentOffset = (offset / (totalSpan || 1)) * 100;
                      const percentWidth = (duration / (totalSpan || 1)) * 100;
                      return (
                        <div key={idx} className="flex flex-col w-full mb-4">
                          <div className="flex flex-row items-center w-full text-base text-text-secondary mb-1 px-1">
                            <span
                              className={`font-semibold text-text-primary text-left truncate flex items-center cursor-pointer underline`}
                              onClick={() => toggleExpanded(activity.Activity)}
                              tabIndex={0}
                              role={'button'}
                              aria-expanded={expanded[activity.Activity]}
                            >
                              {activity.Activity}
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
                          {/* Expandable: show all works for this activity if available */}
                          {expanded[activity.Activity] && works[idx] && (
                            <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-surface-light p-4">
                                <h4 className="text-base font-semibold text-text-primary">
                                  Construction activity details
                                </h4>
                              </div>
                              <div>
                                <div className="hidden md:block overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-2/5">
                                          Work
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
                                      <tr>
                                        <td className="px-4 py-4 text-sm text-text-primary w-2/5">
                                          <span className="text-lg font-semibold text-text-primary flex items-center">
                                            {works[idx]?.Work}
                                          </span>
                                          <div className="text-sm text-text-secondary mt-1">{works[idx]?.Timeline}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-text-primary font-medium w-1/5 text-center">
                                          {works[idx]?.Quantity}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                                          {works[idx]?.Unit}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="md:hidden flex flex-col gap-3">
                                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="text-lg font-semibold text-text-primary mb-1">{works[idx]?.Work}</div>
                                    <div className="text-sm text-text-secondary mb-2">{works[idx]?.Timeline}</div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="font-medium text-text-secondary">Quantity</span>
                                        <span className="text-text-primary">{works[idx]?.Quantity}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="font-medium text-text-secondary">UDM</span>
                                        <span className="text-text-primary">{works[idx]?.Unit}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}

          {/* Action Buttons */}
          {hasArea ? (
            <>
              <div className="md:hidden flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => onPrevious(2)}
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
                </Button>
              </div>
              <div className="hidden md:flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => onPrevious(2)}
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
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="md:hidden flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => onPrevious(1)}
                  className="text-text-secondary hover:text-text-primary"
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to File Upload
                </Button>
                <Button 
                  onClick={onNext} 
                  className="btn-primary"
                  data-testid="button-continue"
                >
                  Continue to Pricing
                </Button>
              </div>
              <div className="hidden md:flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => onPrevious(1)}
                  className="text-text-secondary hover:text-text-primary"
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to File Upload
                </Button>
                <Button 
                  onClick={onNext} 
                  className="btn-primary"
                  data-testid="button-continue"
                >
                  Continue to Pricing
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
