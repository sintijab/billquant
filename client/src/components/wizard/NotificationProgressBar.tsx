import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AlarmCheck, AlertTriangle, Lightbulb, SearchCheck } from 'lucide-react';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';

interface NotificationProgressBarProps {
  areaName: string;
  subareaTitle: string;
}

const iconMap = {
  high: <AlarmCheck className="w-5 h-5 text-white" />,
  medium: <AlertTriangle className="w-5 h-5 text-white" />,
  low: <Lightbulb className="w-5 h-5 text-yellow-900" />,
};

const bgMap = {
  high: 'bg-red-500',
  medium: 'bg-orange-400',
  low: 'bg-yellow-300',
};

const NotificationProgressBar: React.FC<NotificationProgressBarProps> = ({ areaName, subareaTitle }) => {
  const [modalOpenIdx, setModalOpenIdx] = useState<number | null>(null);
  const missing = useSelector((state: RootState) => state.siteWorks.Missing);

  // Find all relevant missing items for this area/subarea
  const relevant = missing.filter(
    (item) => item.Area === areaName && item.Subarea === subareaTitle
  );
  if (!relevant.length) return null;
  const severityOrder = { high: 3, medium: 2, low: 1 };
  const getSeverity = (s: string) => {
    const sev = s.toLowerCase();
    if (sev === 'high' || sev === 'medium' || sev === 'low') return sev as 'high' | 'medium' | 'low';
    return 'low';
  };

  // Sort all by severity
  const sorted = [...relevant].sort((a, b) => severityOrder[getSeverity(b.Severity)] - severityOrder[getSeverity(a.Severity)]);

  return (
    <>
      {sorted.map((item, idx) => {
        const sev = getSeverity(item.Severity);
        return (
          <div key={idx} className={`flex items-center gap-3 mt-4 px-4 py-3 rounded-xl ${bgMap[sev]} transition-all`}>
            <span>{iconMap[sev]}</span>
            <span className={`font-semibold text-sm flex-1 ${sev === 'low' ? 'text-yellow-900' : 'text-white'}`}>
              {item.Missing}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`bg-white/20 hover:bg-white/40 ${sev === 'low' ? 'text-yellow-900' : 'text-white'}`}
              onClick={() => setModalOpenIdx(idx)}
              aria-label="Show risks"
            >
              <SearchCheck className="w-5 h-5" />
            </Button>
            {modalOpenIdx === idx && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl p-8 shadow-xl max-w-lg w-full relative">
                  <button
                    className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200"
                    onClick={() => setModalOpenIdx(null)}
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h4 className="text-lg font-semibold mb-4">Risks & Suggestions</h4>
                  <div className="whitespace-pre-wrap text-gray-800 text-base max-h-[60vh] overflow-y-auto mb-4">
                    <span className="font-semibold">Risks:</span> {item.Risks}
                  </div>
                  {item.Suggestions && (
                    <div className="whitespace-pre-wrap text-gray-800 text-base max-h-[60vh] overflow-y-auto">
                      <span className="font-semibold">What to add?</span> {item.Suggestions}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default NotificationProgressBar;
