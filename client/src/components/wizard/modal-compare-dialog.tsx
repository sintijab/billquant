import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Loader from "../ui/loader";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { closeModalCompare } from "@/features/boqSlice";
import React, { useState, useEffect } from "react";

interface ModalCompareProps {
  modalCompare: any;
  modalLoading: boolean;
}

const ModalCompareDialog: React.FC<ModalCompareProps> = ({ modalCompare, modalLoading }) => {
  const dispatch = useDispatch();
  const [selectedCol, setSelectedCol] = useState<'original' | 'new' | null>(null);
  const [open, setOpen] = useState(!!modalCompare && !modalLoading);

  // Keep open state in sync with props
  useEffect(() => {
    setOpen(!!modalCompare && !modalLoading);
  }, [modalCompare, modalLoading]);

  // When dialog is closed, dispatch closeModalCompare AFTER close animation
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        dispatch(closeModalCompare());
      }, 200); // 200ms matches shadcn/radix dialog close animation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        {modalLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader size="xs" />
          </div>
        ) : !!modalCompare ? (
          <>
            <DialogHeader>
              <DialogTitle>Compare Activities</DialogTitle>
              <DialogDescription>
                Review and choose which activity data to keep or merge.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-6 min-w-[700px] overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {/* Original Activity Column */}
              <div
                className={`flex-1 border rounded-lg p-4 cursor-pointer ${selectedCol === 'original' ? 'border-primary ring-2 ring-primary' : 'border-gray-200'}`}
                onClick={() => setSelectedCol('original')}
                style={{ minWidth: 0, overflowX: 'auto' }}
              >
                <div className="font-semibold mb-2">Current Activity</div>
                {/* ...existing code for original activity table... */}
                {modalCompare.original ? (
                  Array.isArray(modalCompare.original.results) && modalCompare.original.results.length > 0 ? (
                    <table className="w-full text-xs border-separate border-spacing-0 mb-2">
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
                            <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Activity</th>
                            <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Category</th>
                            <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Code</th>
                            <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Title/Description</th>
                            <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Unit</th>
                            <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Quantity</th>
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
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Code</th>
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Description</th>
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Unit</th>
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Quantity</th>
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Formula</th>
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Price</th>
                                <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Total</th>
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
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Code</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Description</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Unit</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Quantity</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Formula</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Price</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Total</th>
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
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Code</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Description</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Unit</th>
                          <th className="px-2 py-2 text-left font-medium text-text-secondary border-b border-gray-200">Quantity</th>
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
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button
                disabled={!selectedCol}
                onClick={() => {
                  // TODO: Implement replace/keep logic in Redux
                  dispatch(closeModalCompare());
                }}
                className="btn-primary"
              >
                {selectedCol === 'original' ? 'Keep Current' : 'Replace with New'}
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement keep both logic in Redux
                  dispatch(closeModalCompare());
                }}
                variant="outline"
              >
                Keep Both
              </Button>
              <Button
                onClick={() => dispatch(closeModalCompare())}
                variant="ghost"
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ModalCompareDialog;
