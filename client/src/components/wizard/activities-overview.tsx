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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Planned Work Activities</h2>
            <p className="text-text-secondary text-lg">
              Overview the construction activitiy summary based on your site visit.
            </p>
          </div>

          {/* Activity Categories from siteWorks */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([workName, activities], idx) => {
              const acts = activities as any[];
              return (
                <div key={workName} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-surface-light p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-text-primary flex items-center">
                        {/* Optionally add an icon here if you want */}
                        {workName}
                      </h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-2/5">
                            Description
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
                        {acts.map((activity: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-light transition-colors">
                            <td className="px-4 py-4 text-sm text-text-primary w-2/5">
                              {activity.Timeline}
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                              {activity.Area} {activity.Subarea ? `/ ${activity.Subarea}` : ''}
                            </td>
                            <td className="px-4 py-4 text-sm text-text-primary font-medium w-1/5 text-center">
                              {activity.Quantity}
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary w-1/5 text-center">
                              {activity.Unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Summary from GeneralTimeline */}
          <div className="mt-8 bg-surface-light rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-primary mr-2" />
              Estimated Timeline (days)
            </h3>
            {/* Progress Bar Timeline */}
            <div className="w-full flex flex-col gap-4">
              {/* Calculate total timeline span */}
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
                  return (
                    <div key={idx} className="flex flex-col w-full">
                      <div className="flex flex-row items-center w-full text-base text-text-secondary mb-1 px-1">
                        <span className="font-semibold text-text-primary flex-1 text-left truncate">{activity.Activity}</span>
                        <span className="ml-4 flex-1 text-right text-text-secondary whitespace-nowrap flex items-center justify-end">
                          <Clock className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                          {activity.Starting}-{activity.Finishing} days
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
                    </div>
                  );
                });
              })()}
            </div>
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
