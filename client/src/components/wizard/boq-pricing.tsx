import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  RefreshCw,
} from "lucide-react";
import { ProjectWizardData } from "@/lib/types";
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivityCategoryDei, fetchActivityCategoryPat, fetchActivityCategoryPiemonte } from '@/features/boqSlice';
import { clearCategoryError } from '@/features/boqSlice';
import { toast } from "@/hooks/use-toast";
import { selectAllTableItems } from '@/features/boqSelectors';

interface BOQPricingProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

import type { RootState, AppDispatch } from '@/store';
import Loader from "../ui/loader";

const BOQPricing = ({ data, onUpdate, onNext, onPrevious }: BOQPricingProps) => {

  const dispatch: AppDispatch = useDispatch();
  const siteWorks = useSelector((state: RootState) => state.siteWorks);
  const boq = useSelector((state: RootState) => state.boq);
  const works = siteWorks.Works || [];
  const timeline = siteWorks.GeneralTimeline?.Activities || [];
  const [priceListSource, setPriceListSource] = useState("pat");

  useEffect(() => {
    handleRefreshPrices();
  }, [priceListSource]);

  useEffect(() => {
    for (const activity of timeline) {
      const catObj = boq.categories[activity.Activity];
      if (catObj && catObj.error) {
        toast({
          title: "Something went wrong. Please try again.",
          description: catObj.error,
          variant: "destructive",
        });
        break;
      }
    }
  }, [timeline, boq.categories]);

  const loading = boq.loading;

  useEffect(() => {
    if (loading) return;
    const fetchSequentially = async () => {
      for (const activity of timeline) {
        if (loading) break;
        if (activity.Activity && priceListSource === 'dei') {
          const catObj = boq.categories[activity.Activity];
          if (!catObj || (!catObj.deiItems?.length && !catObj.deiError)) {
            await dispatch(fetchActivityCategoryDei(activity.Activity)).unwrap();
            break;
          }
        }
        if (activity.Activity && priceListSource === 'pat') {
          const catObj = boq.categories[activity.Activity];
          if (!catObj || (!catObj.patItems?.length && !catObj.patError)) {
            await dispatch(fetchActivityCategoryPat(activity.Activity)).unwrap();
            break;
          }
        }
        if (activity.Activity && priceListSource === 'piemonte') {
          const catObj = boq.categories[activity.Activity];
          if (!catObj || (!catObj.piemonteItems?.length && !catObj.piemonteError)) {
            await dispatch(fetchActivityCategoryPiemonte(activity.Activity)).unwrap();
            break;
          }
        }
      }
    };
    fetchSequentially();
  }, []);

  const handleSelectHighestPrices = () => {
    console.log("Selecting highest prices");
  };

  // Only refresh activities that are missing prices or errored for the selected source
  const handleRefreshPrices = () => {
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
        dispatch(clearCategoryError(activity.Activity));
        dispatch(fetchThunk(activity.Activity) as any);
      }
    }
  };

  const handleAddItem = () => {
    console.log("Add new BOQ item");
  };

  // Use selector to get all table items (merged from all sources)
  const allTableItems = useSelector(selectAllTableItems);

  // Sort table items according to timeline order
  const timelineOrder = timeline.map((a: any) => a.Activity);
  const sortedTableItems = timelineOrder
    .map((activityName: string) =>
      allTableItems.filter(item => item.activity === activityName || item.activityName === activityName)
    )
    .flat();

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
          {
            loading && (<div className="absolute inset-0 flex items-center justify-center z-50 bg-gray-100 bg-opacity-80 rounded-2xl">
              <Loader size="xs" />
            </div>)
          }
          {/* Pricing Controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-text-primary">Price List Source:</label>
              <Select value={priceListSource} onValueChange={setPriceListSource}>
                <SelectTrigger className="w-[280px]" data-testid="select-price-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pat">Provincia Autonoma di Trento 2025</SelectItem>
                  <SelectItem value="dei">Prezziario DEI 2025</SelectItem>
                  <SelectItem value="piemonte">Regione Piemonte 2025</SelectItem>
                  <SelectItem value="highest">Highest Justifiable Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSelectHighestPrices}
              className="bg-accent-orange hover:bg-orange-600 text-white"
              data-testid="button-select-highest"
              size="sm"
            >
              Select Highest Prices
            </Button>
            <Button
              variant="outline"
              onClick={handleAddItem}
              className="border-1 border-primary text-primary hover:bg-primary hover:text-white"
              data-testid="button-add-boq-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New BOQ Item
            </Button>
          </div>

          {/* Unified BOQ Table for all activities, main items, and resources */}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-primary tracking-wider border-b border-gray-200">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTableItems.filter(item => item.type === 'main').map((item, i) => (
                    <>
                      <tr key={i} className="hover:bg-surface-light transition-colors">
                        <td className="px-4 py-4 text-sm text-text-primary font-medium align-top">{item.activityName || item.activity}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.mainCategory}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.code}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.title || item.description}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.unit}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.quantity}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.price}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.total}</td>
                        <td className="px-4 py-4 text-sm text-text-primary align-top">{item.priceSource?.toUpperCase()}</td>
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
                  ))}
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
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="text-text-secondary hover:text-text-primary"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Activities
            </Button>
            <Button
              onClick={onNext}
              className="btn-primary"
              data-testid="button-continue"
            >
              Create Documents
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default BOQPricing;
