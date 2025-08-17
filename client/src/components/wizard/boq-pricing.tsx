import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  RefreshCw,
  Euro,
  TrendingUp
} from "lucide-react";
import { ProjectWizardData } from "@/lib/types";

interface BOQPricingProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function BOQPricing({ data, onUpdate, onNext, onPrevious }: BOQPricingProps) {
  const [priceListSource, setPriceListSource] = useState("trento");

  // Sample BOQ items based on the design
  const sampleBoqItems = [
    {
      id: "1",
      code: "B.02.10.0010.007",
      description: "Demolizione di fabbricati volumetria ≤ 5000 m³",
      length: "10.0",
      width: "10.0", 
      factor: "0.35",
      quantity: "35.0",
      unit: "m³",
      unitPrice: "11.87",
      total: "415.45",
      priceSource: "PAT 2025"
    },
    {
      id: "2",
      code: "E.02.15.0025.003",
      description: "Rimozione pavimento in legno esistente",
      length: "27.3",
      width: "1.0",
      factor: "1.0",
      quantity: "27.3",
      unit: "m²",
      unitPrice: "8.50",
      total: "232.05",
      priceSource: "DEI 2025"
    },
    {
      id: "3",
      code: "C.03.20.0150.008",
      description: "Posa piastrelle ceramiche per pavimento",
      length: "27.3",
      width: "1.0",
      factor: "1.0",
      quantity: "27.3",
      unit: "m²",
      unitPrice: "35.20",
      total: "960.96",
      priceSource: "PAT 2025"
    },
    {
      id: "4",
      code: "D.01.10.0050.002",
      description: "Punto presa elettrica standard",
      length: "8.0",
      width: "1.0",
      factor: "1.0",
      quantity: "8.0",
      unit: "pz",
      unitPrice: "45.80",
      total: "366.40",
      priceSource: "ANAS 2025"
    }
  ];

  const subtotal = sampleBoqItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const markup = subtotal * 0.35;
  const totalCost = subtotal + markup;

  const handleSelectHighestPrices = () => {
    console.log("Selecting highest prices");
  };

  const handleRefreshPrices = () => {
    console.log("Refreshing prices");
  };

  const handleEditItem = (itemId: string) => {
    console.log("Edit item:", itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    console.log("Delete item:", itemId);
  };

  const handleAddItem = () => {
    console.log("Add new BOQ item");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Bill of Quantities & Pricing</h2>
            <p className="text-text-secondary text-lg">
              Review and adjust pricing for construction activities with regional price lists
            </p>
          </div>

          {/* Pricing Controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-text-primary">Price List Source:</label>
              <Select value={priceListSource} onValueChange={setPriceListSource}>
                <SelectTrigger className="w-[280px]" data-testid="select-price-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trento">Provincia Autonoma di Trento 2025</SelectItem>
                  <SelectItem value="dei">Prezziario DEI 2025</SelectItem>
                  <SelectItem value="anas">ANAS 2025</SelectItem>
                  <SelectItem value="highest">Highest Justifiable Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSelectHighestPrices}
              className="bg-accent-orange hover:bg-orange-600 text-white"
              data-testid="button-select-highest"
            >
              Select Highest Prices
            </Button>
            <Button 
              variant="outline"
              onClick={handleRefreshPrices}
              className="bg-surface-light hover:bg-gray-200"
              data-testid="button-refresh-prices"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Prices
            </Button>
          </div>

          {/* BOQ Table */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Length</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Width</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Factor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">UDM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Unit Price (€)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Total (€)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleBoqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-light transition-colors">
                    <td className="px-4 py-4 text-xs font-mono text-text-primary">{item.code}</td>
                    <td className="px-4 py-4 text-sm text-text-primary max-w-xs">{item.description}</td>
                    <td className="px-4 py-4 text-sm text-text-primary text-right">{item.length}</td>
                    <td className="px-4 py-4 text-sm text-text-primary text-right">{item.width}</td>
                    <td className="px-4 py-4 text-sm text-text-primary text-right">{item.factor}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-text-primary text-right">{item.quantity}</td>
                    <td className="px-4 py-4 text-sm text-text-secondary">{item.unit}</td>
                    <td className="px-4 py-4 text-sm text-text-primary text-right">{item.unitPrice}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-primary text-right">{item.total}</td>
                    <td className="px-4 py-4 text-xs text-text-secondary">
                      <Badge variant="outline">{item.priceSource}</Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item.id)}
                          className="text-primary hover:text-primary-dark"
                          data-testid={`button-edit-boq-${item.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                          data-testid={`button-delete-boq-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-right font-semibold text-text-primary">
                    Subtotal (Materials & Labor):
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-xl text-primary">
                    €{subtotal.toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-right font-semibold text-text-primary">
                    Company Costs & Markup (35%):
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-lg text-accent-orange">
                    €{markup.toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="border-t-2 border-primary">
                  <td colSpan={8} className="px-4 py-4 text-right font-bold text-lg text-text-primary">
                    Total Project Cost:
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-2xl text-primary flex items-center justify-end">
                    <Euro className="h-5 w-5 mr-1" />
                    {totalCost.toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add New Item */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={handleAddItem}
              className="border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white"
              data-testid="button-add-boq-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New BOQ Item
            </Button>
          </div>

          {/* Pricing Summary */}
          <div className="bg-surface-light rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-primary mr-2" />
              Pricing Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">€{subtotal.toFixed(0)}</div>
                <div className="text-sm text-text-secondary">Direct Costs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-orange">35%</div>
                <div className="text-sm text-text-secondary">Markup Applied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-green">€{(totalCost / (subtotal + markup) * 100 || 0).toFixed(0)}</div>
                <div className="text-sm text-text-secondary">Profit Margin %</div>
              </div>
            </div>
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
}
