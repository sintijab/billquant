import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivityCategoryDei, fetchActivityCategoryPat, fetchActivityCategoryPiemonte, fetchCategoryData, fetchActivityBySource, closeModalCompare } from '@/features/boqSlice';
import CompareActivitiesPanel from "./compare-activities-panel";
import { selectAllTableItems } from '@/features/boqSelectors';

interface BOQPricingProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

import type { RootState, AppDispatch } from '@/store';
import Loader from "../ui/loader";

const BOQPricing = ({ onNext, onPrevious }: BOQPricingProps) => {

  const dispatch: AppDispatch = useDispatch();
  const siteWorks = useSelector((state: RootState) => state.siteWorks);
  const boq = useSelector((state: RootState) => state.boq);
  const timeline = siteWorks.GeneralTimeline?.Activities || [];
  const [priceListSource, setPriceListSource] = useState("pat");

  const modalCompare = useSelector((state: RootState) => state.boq.modalCompare);
  const modalLoading = useSelector((state: RootState) => state.boq.modalLoading);

  const loading = boq.loading;

  useEffect(() => {
    handleRefreshPrices();
  }, [modalCompare]);

  // Only refresh activities that are missing prices or errored for the selected source
  const handleRefreshPrices = async () => {
    let fetchThunk;
    if (priceListSource === 'dei') fetchThunk = fetchActivityCategoryDei;
    else if (priceListSource === 'pat') fetchThunk = fetchActivityCategoryPat;
    else if (priceListSource === 'piemonte') fetchThunk = fetchActivityCategoryPiemonte;
    else return;
    for (const activity of timeline) {
      if (!activity.Activity) continue;
      const catObj = boq.categories[activity.Activity];
      let missing = false;
      if (priceListSource === 'dei') missing = !catObj || (!catObj.deiItems?.length && !catObj.error);
      if (priceListSource === 'pat') missing = !catObj || (!catObj.patItems?.length && !catObj.error);
      if (priceListSource === 'piemonte') missing = !catObj || (!catObj.piemonteItems?.length && !catObj.error);
      // Also refresh if there is an error
      if (catObj && catObj.error) missing = true;
      if (missing) {
        await dispatch(fetchCategoryData(activity.Activity)).unwrap();
        await dispatch(fetchThunk(activity.Activity) as any);
      }
    }
  };

  // Use selector to get all table items (merged from all sources)
  const allTableItems = useSelector(selectAllTableItems);

  const sortedTableItems = useMemo(() => {
    const timelineOrder = timeline.map((a: any) => a.Activity);
    return timelineOrder
      .map((activityName: string) =>
        allTableItems.filter(item => item.activity === activityName || item.activityName === activityName)
      )
      .flat();
  }, [allTableItems, boq]);

  // Check if any prices are missing or errored for the selected source
  const hasMissingPrices = timeline.some(activity => {
    if (!activity.Activity) return false;
    const catObj = boq.categories[activity.Activity];
    if (!catObj) return true;
    if (catObj.error) return true;
    if (priceListSource === 'dei' && (!catObj.deiItems || catObj.deiItems.length === 0)) return true;
    if (priceListSource === 'pat' && (!catObj.patItems || catObj.patItems.length === 0)) return true;
    if (priceListSource === 'piemonte' && (!catObj.piemonteItems || catObj.piemonteItems.length === 0)) return true;
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Bill of Quantities & Pricing</h2>
            <p className="text-text-secondary text-lg">
              Review and adjust pricing for construction activities with regional price lists
            </p>
          </div>
          {/* Always render both the table and the compare panel, toggle visibility with CSS */}
          <div className={modalCompare ? 'hidden' : ''}>
            <div className="w-full flex flex-col gap-4 mb-6">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Title/Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Source</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedTableItems.filter(item => item.type === 'main').map((item, i) => { 
                      const rowKey = item.id || item.code || item.activity || i;
                      return (
                      <>
                        <tr key={rowKey} className="hover:bg-surface-light transition-colors">
                          <td className="px-4 py-4 text-sm text-text-primary font-medium align-top">{item.activityName || item.activity}</td>
                          <td className="px-4 py-4 text-sm text-text-primary align-top">{item.mainCategory}</td>
                          <td className="px-4 py-4 text-sm text-text-primary align-top">{item.code}</td>
                          <td className="px-4 py-4 text-sm text-text-primary align-top">{item.title || item.description}</td>
                          <td className="px-4 py-4 text-sm text-text-primary align-top">{item.unit}</td>
                          <td className="px-4 py-4 text-sm text-text-primary align-top">{item.quantity}</td>
                          <td className="px-4 py-4 text-sm text-text-primary align-top">
                            <Select
                              value={item.priceSource || priceListSource}
                              disabled={modalLoading}
                              onValueChange={async (val) => {
                                await dispatch(fetchActivityBySource({
                                  activity: item.activity,
                                  description: `${item.description}${item.title || ''} `,
                                  priceSource: val,
                                  rowIndex: i,
                                }));
                              }}
                            >
                              <SelectTrigger className="w-[180px]" data-testid={`select-price-source-row-${i}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pat">Provincia Autonoma di Trento 2025</SelectItem>
                                <SelectItem value="dei">Prezziario DEI 2025</SelectItem>
                                <SelectItem value="piemonte">Regione Piemonte 2025</SelectItem>
                                <SelectItem value="highest">Highest Justifiable Price</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                        {Array.isArray(item.resources) && item.resources.length > 0 && (
                          <tr>
                            <td colSpan={10} className="p-0 bg-surface-light">
                              <div className="pl-6 pb-2">
                                <table className="w-full text-xs border-separate border-spacing-0">
                                  <thead>
                                    <tr>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Code</th>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Description</th>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Unit</th>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Quantity</th>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Formula</th>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Price</th>
                                      <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-100">
                                    {item.resources.map((res: any, ridx: number) => (
                                      <tr key={ridx} className="hover:bg-gray-50">
                                        <td className="px-2 py-2 align-top">{res.code}</td>
                                        <td className="px-2 py-2 align-top">{res.title || res.description}</td>
                                        <td className="px-2 py-2 align-top">{res.unit}</td>
                                        <td className="px-2 py-2 align-top">{res.quantity}</td>
                                        <td className="px-2 py-2 align-top">{res.formula}</td>
                                        <td className="px-2 py-2 align-top">{res.price}</td>
                                        <td className="px-2 py-2 align-top">{res.total}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )})}
                  </tbody>
                </table>
              </div>
              {/* Error message for missing prices */}
              {hasMissingPrices && !loading && (
                <div className="mt-4 text-center rounded-lg py-2 px-4 flex flex-col items-center">
                  <span className="text-sm text-accent bg-destructive/10 mb-2">Some prices are missing, please refresh to get price proposal for all activities.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshPrices}
                    className="bg-surface-light hover:bg-gray-200 max-w-md"
                    data-testid="button-refresh-prices"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Prices
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className={modalCompare ? '' : 'hidden'}>
            <CompareActivitiesPanel
              modalCompare={modalCompare}
              modalLoading={!!modalLoading}
              onClose={() => dispatch(closeModalCompare())}
            />
          </div>
          {
            loading && (<div className="inset-0 flex items-center justify-center z-50 bg-white/60 bg-opacity-80 rounded-2xl">
              <Loader size="xs" />
            </div>)
          }
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary"
              data-testid="button-back"
            >
              Back to Activities
            </Button>
            <Button
              onClick={onNext}
              className="btn-primary"
              data-testid="button-continue"
              disabled={loading}
            >
              Create Quotation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BOQPricing;
