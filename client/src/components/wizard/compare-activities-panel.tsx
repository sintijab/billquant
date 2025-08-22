
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Loader from "../ui/loader";
import { useDispatch } from "react-redux";
import { replaceActivityWithNew, keepCurrentActivity, keepBothActivities } from "@/features/boqSlice";

interface CompareActivitiesPanelProps {
  modalCompare: any;
  modalLoading: boolean;
  onClose: () => void;
}

const CompareActivitiesPanel: React.FC<CompareActivitiesPanelProps> = ({ modalCompare, modalLoading, onClose }) => {
  const [selectedCol, setSelectedCol] = useState<'original' | 'new' | null>(null);
  const dispatch = useDispatch();

  // Check for error in newData (API response)
  useEffect(() => {
    if (!modalLoading && modalCompare && modalCompare.newData && modalCompare.newData.error) {
      onClose();
    }
  }, [modalLoading, modalCompare, onClose]);

  if (modalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader size="xs" />
      </div>
    );
  }

  // If error, do not render the comparison tables
  if (!modalCompare || (modalCompare.newData && modalCompare.newData.error)) return null;

  const handleAction = () => {
    if (selectedCol === 'original') {
      dispatch(keepCurrentActivity());
      onClose();
    } else if (selectedCol === 'new') {
      dispatch(replaceActivityWithNew());
      onClose();
    }
  };

  const handleKeepBoth = () => {
    dispatch(keepBothActivities());
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto max-w-6xl mx-auto bg-white rounded-xl shadow-lg mt-8">
      <div className="text-lg font-bold text-center">Compare Activities</div>
      <div className="flex gap-6 min-w-[700px]">
        {/* Original Activity Column */}
        <div
          className={`flex-1 border rounded-lg p-4 cursor-pointer ${selectedCol === 'original' ? 'border-primary ring-2 ring-primary' : 'border-gray-200'}`}
          onClick={() => setSelectedCol('original')}
          style={{ minWidth: 0, overflowX: 'auto' }}
        >
          <div className="font-semibold mb-2">Current Activity</div>
          {modalCompare.original ? (
            Array.isArray(modalCompare.original.results) && modalCompare.original.results.length > 0 ? (
              <table className="w-full text-xs border-separate border-spacing-0 mb-2">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Code</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Description</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Unit</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Quantity</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Formula</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Price</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalCompare.original.results.map((item: any, idx: number) => (
                    Array.isArray(item.resources) && item.resources.length > 0
                      ? item.resources.map((res: any, ridx: number) => (
                          <tr key={idx + '-' + ridx} className="hover:bg-gray-50">
                            <td className="px-2 py-2 align-top">{res.code || ''}</td>
                            <td className="px-2 py-2 align-top">{res.title || res.description || ''}</td>
                            <td className="px-2 py-2 align-top">{res.unit || ''}</td>
                            <td className="px-2 py-2 align-top">{res.quantity || ''}</td>
                            <td className="px-2 py-2 align-top">{res.formula || ''}</td>
                            <td className="px-2 py-2 align-top">{res.price || ''}</td>
                            <td className="px-2 py-2 align-top">{res.total || ''}</td>
                          </tr>
                        ))
                      : null
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <table className="w-full text-xs border-separate border-spacing-0 mb-2">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Activity</th>
                      <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Category</th>
                      <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Code</th>
                      <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Title/Description</th>
                      <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Unit</th>
                      <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-2 align-top">{modalCompare.original.activityName || modalCompare.original.activity || ''}</td>
                      <td className="px-2 py-2 align-top">{modalCompare.original.mainCategory || ''}</td>
                      <td className="px-2 py-2 align-top">{modalCompare.original.code || ''}</td>
                      <td className="px-2 py-2 align-top">{modalCompare.original.title || modalCompare.original.description || ''}</td>
                      <td className="px-2 py-2 align-top">{modalCompare.original.unit || ''}</td>
                      <td className="px-2 py-2 align-top">{modalCompare.original.quantity || ''}</td>
                    </tr>
                  </tbody>
                </table>
                {Array.isArray(modalCompare.original.resources) && modalCompare.original.resources.length > 0 && (
                  <div className="pl-2 pb-2">
                    <div className="font-semibold mb-1">Resources</div>
                    <table className="w-full text-xs border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Code</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Description</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Unit</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Quantity</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Formula</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Price</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalCompare.original.resources.map((res: any, ridx: number) => (
                          <tr key={ridx} className="hover:bg-gray-50">
                            <td className="px-2 py-2 align-top">{res.code || ''}</td>
                            <td className="px-2 py-2 align-top">{res.title || res.description || ''}</td>
                            <td className="px-2 py-2 align-top">{res.unit || ''}</td>
                            <td className="px-2 py-2 align-top">{res.quantity || ''}</td>
                            <td className="px-2 py-2 align-top">{res.formula || ''}</td>
                            <td className="px-2 py-2 align-top">{res.price || ''}</td>
                            <td className="px-2 py-2 align-top">{res.total || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )
          ) : <div className="text-xs text-gray-400">No data</div>}
        </div>
        {/* New Activity Column */}
        <div
          className={`flex-1 border rounded-lg p-4 cursor-pointer ${selectedCol === 'new' ? 'border-primary ring-2 ring-primary' : 'border-gray-200'}`}
          onClick={() => setSelectedCol('new')}
        >
          <div className="font-semibold mb-2">New Activity ({modalCompare.priceSource})</div>
          {modalCompare.newData ? (
            Array.isArray(modalCompare.newData.results) && modalCompare.newData.results.length > 0 ? (
              <table className="w-full text-xs border-separate border-spacing-0 mb-2">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Code</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Description</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Unit</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Quantity</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Formula</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Price</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalCompare.newData.results.map((item: any, idx: number) => (
                    Array.isArray(item.resources) && item.resources.length > 0
                      ? item.resources.map((res: any, ridx: number) => (
                          <tr key={idx + '-' + ridx} className="hover:bg-gray-50">
                            <td className="px-2 py-2 align-top">{res.code || ''}</td>
                            <td className="px-2 py-2 align-top">{res.title || res.description || ''}</td>
                            <td className="px-2 py-2 align-top">{res.unit || ''}</td>
                            <td className="px-2 py-2 align-top">{res.quantity || ''}</td>
                            <td className="px-2 py-2 align-top">{res.formula || ''}</td>
                            <td className="px-2 py-2 align-top">{res.price || ''}</td>
                            <td className="px-2 py-2 align-top">{res.total || ''}</td>
                          </tr>
                        ))
                      : null
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs border-separate border-spacing-0 mb-2">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Code</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Description</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Unit</th>
                    <th className="px-2 py-2 text-left font-medium text-text-secondary border border-gray-200">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-2 align-top">{modalCompare.newData.code || ''}</td>
                    <td className="px-2 py-2 align-top">{modalCompare.newData.title || modalCompare.newData.description || ''}</td>
                    <td className="px-2 py-2 align-top">{modalCompare.newData.unit || ''}</td>
                    <td className="px-2 py-2 align-top">{modalCompare.newData.quantity || ''}</td>
                  </tr>
                </tbody>
              </table>
            )
          ) : <div className="text-xs text-gray-400">No data</div>}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button
          disabled={!selectedCol}
          onClick={handleAction}
          className="btn-primary"
        >
          {selectedCol === 'original' ? 'Keep Current' : 'Replace with New'}
        </Button>
        <Button
          onClick={handleKeepBoth}
          variant="outline"
        >
          Keep Both
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CompareActivitiesPanel;
