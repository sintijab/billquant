import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Camera, Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import heic2any from "heic2any";
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { setSiteVisit, analyzeImages } from '@/features/siteVisitSlice';
import { fetchSiteWorks, resetSiteWorks } from '@/features/siteWorksSlice';
import { formatAreaData } from '@/lib/formatAreaData';
import Loader from "../ui/loader";

interface SubareaCardProps {
    sub: any;
    areaIdx: number;
    subIdx: number;
    onUpdate: (updates: any) => void;
    data: any;
    setGeneratingDesc: (id: string | null) => void;
}

const SubareaCard: React.FC<SubareaCardProps> = ({ sub, areaIdx, subIdx, onUpdate, data, setGeneratingDesc }) => {
    // heic2any is now imported directly
    // Refs to track previous values for quantity and udm for each item
    const prevQuantityRef = useRef<{ [key: string]: string }>({});
    const prevUdmRef = useRef<{ [key: string]: string }>({});
    // Ref to track previous description value for each item
    const prevDescriptionsRef = useRef<{ [key: string]: string }>({});
    const dispatch = useDispatch<AppDispatch>();
    const [photoPopover, setPhotoPopover] = useState(false);
    const [livePhotoModal, setLivePhotoModal] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Live photo logic
    const handleStartCamera = async () => {
        if (videoRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;
            } catch (err) {
                alert("Camera access denied or unavailable.");
            }
        }
    };

    const handleCapturePhoto = async () => {
        if (videoRef.current) {
            setLivePhotoModal(false); // Close modal immediately
            // Stop camera immediately after capture
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            const canvas = document.createElement("canvas");
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
                const url = canvas.toDataURL("image/png");
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const fileName = `LivePhoto_${timestamp}.png`;
                // Stop camera stream right after capture
                if (videoRef.current && videoRef.current.srcObject) {
                    (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                setAnalyzing(true);
                let description = '';
        // Prepend area/subarea numbers to names/titles for Redux/AI
        const areaName = data.siteAreas[areaIdx]?.name || '';
        const subareaTitle = data.siteAreas[areaIdx]?.subareas?.[subIdx]?.title || '';
        const fullAreaName = `Area no. ${areaIdx + 1} ${areaName.replace(new RegExp(`^Area no. ${areaIdx + 1} ?`), '')}`.trim();
        const fullSubareaTitle = `Subarea no. ${subIdx + 1} ${subareaTitle.replace(new RegExp(`^Subarea no. ${subIdx + 1} ?`), '')}`.trim();
        if (data.aiConsent) {
                    try {
                        // Convert dataURL to Blob
                        const res = await fetch(url);
                        const blob = await res.blob();
                        const formData = new FormData();
                        formData.append('file', blob, fileName);
            // Optionally append area/subarea info for AI
            formData.append('areaName', fullAreaName);
            formData.append('subareaTitle', fullSubareaTitle);
                        const result = await dispatch(analyzeImages(formData)).unwrap();
                        if ((result as any).answer) description = (result as any).answer;
                    } catch (err) {
                        description = '';
                    }
                }
                onUpdate({
                    siteAreas: data.siteAreas.map((a: any, i: number) =>
                        i === areaIdx
                            ? {
                                ...a,
                                subareas: a.subareas.map((s: any, si: number) =>
                                    si === subIdx
                                        ? {
                                            ...s,
                                            items: [
                                                ...(s.items || []),
                                                {
                                                    id: `item-${Date.now()}`,
                                                    status: '',
                                                    dimensions: '',
                                                    udm: '',
                                                    quantity: '',
                                                    description,
                                                    photos: [{ url, fileName }]
                                                }
                                            ]
                                        }
                                        : s
                                ),
                            }
                            : a
                    ),
                });
                setAnalyzing(false);
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 relative">
            {analyzing && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/60 rounded-2xl">
                    <Loader size="xxs" />
                </div>
            )}
            {/* Close button moved to site-visit.tsx next to subarea name input */}
            {/* Photo grid */}
            <div className="flex flex-col gap-4 mb-4">
                {sub.items?.map((item: any, itemIdx: number) => (
                    <div key={item.id} className="flex flex-row items-start justify-center bg-gray-50 rounded-xl border p-2 w-full relative min-h-[12rem] flex-wrap" style={{ minHeight: '200px' }}>
                        {/* Show first photo if exists, with HEIC and error support */}
                        {item.photos && item.photos.length > 0 && (
                            item.photos[0].url && item.photos[0].url.startsWith('data:image') ? (
                                <img
                                    src={item.photos[0].url}
                                    alt="Subarea Item"
                                    className="w-40 h-full max-h-[200px] object-cover rounded-xl border bg-gray-200"
                                    style={{ objectFit: 'cover', height: '100%', maxHeight: '200px', width: '160px' }}
                                />
                            ) : item.photos[0].url && item.photos[0].url.startsWith('blob:') ? (
                                <img
                                    src={item.photos[0].url}
                                    alt="Subarea Item"
                                    className="w-40 h-full max-h-[200px] object-cover rounded-xl border bg-gray-200"
                                    style={{ objectFit: 'cover', height: '100%', maxHeight: '200px', width: '160px' }}
                                />
                            ) : item.photos[0].error ? (
                                <div className="w-40 h-full max-h-[200px] flex items-center justify-center bg-gray-200 rounded-xl border text-xs text-gray-500" style={{ height: '100%', maxHeight: '200px', width: '160px' }}>
                                    {item.photos[0].fileName}<br/>HEIC not supported
                                </div>
                            ) : null
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 p-1 text-primary-dark hover:bg-gray-200 hover:text-primary-dark focus:outline-none transition-colors"
                            aria-label="Remove item"
                            onClick={() => {
                                const updatedSiteAreas = data.siteAreas.map((a: any, i: number) =>
                                    i === areaIdx
                                        ? {
                                            ...a,
                                            subareas: a.subareas.map((s: any, si: number) =>
                                                si === subIdx
                                                    ? { ...s, items: s.items.filter((_: any, ii: number) => ii !== itemIdx) }
                                                    : s
                                            )
                                        }
                                        : a
                                );
                                const mergeWorks = (oldAreas: any[], newAreas: any[]) => {
                                    return newAreas.map((area: any, i: number) => {
                                        if (!oldAreas[i]) return area;
                                        return {
                                            ...area,
                                            subareas: area.subareas.map((sub: any, j: number) => {
                                                if (!oldAreas[i].subareas[j]) return sub;
                                                // If subarea id matches, merge items
                                                return {
                                                    ...sub,
                                                    items: sub.items
                                                };
                                            })
                                        };
                                    });
                                };
                                const merged = { ...data, siteAreas: mergeWorks(data.siteAreas, updatedSiteAreas) };
                                onUpdate(merged);
                                dispatch(setSiteVisit(merged));
                            }}
                        >
                            <span className="sr-only">Remove item</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                        <div className="flex-1 flex flex-col gap-1 md:pl-4">
                            {/* First line: file name (left), delete icon (right) */}
                            <div className="flex flex-row items-center justify-between mb-1 px-2 py-3">
                                <span className="text-sm font-normal text-gray-700 truncate max-w-[60%] pr-4">
                                    {item.photos && item.photos[0]?.fileName ? item.photos[0].fileName : 'Photo'}
                                </span>
                            </div>
                            <Textarea
                                value={item.description || ''}
                                onFocus={() => {
                                    // Store the previous value on focus
                                    prevDescriptionsRef.current[item.id] = item.description || '';
                                }}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    onUpdate({
                                        siteAreas: data.siteAreas.map((a: any, i: number) =>
                                            i === areaIdx
                                                ? {
                                                    ...a,
                                                    subareas: a.subareas.map((s: any, si: number) =>
                                                        si === subIdx
                                                            ? {
                                                                ...s,
                                                                items: s.items.map((it: any, ii: number) =>
                                                                    ii === itemIdx ? { ...it, description: e.target.value } : it
                                                                ),
                                                            }
                                                            : s
                                                    ),
                                                }
                                                : a
                                        ),
                                    });
                                }}
                                onBlur={async (e: React.FocusEvent<HTMLTextAreaElement>) => {
                                    const prevValue = prevDescriptionsRef.current[item.id] || '';
                                    if (prevValue !== e.target.value) {
                                        const updatedSiteAreas = data.siteAreas.map((a: any, i: number) =>
                                            i === areaIdx
                                                ? {
                                                    ...a,
                                                    subareas: a.subareas.map((s: any, si: number) =>
                                                        si === subIdx
                                                            ? {
                                                                ...s,
                                                                items: s.items.map((it: any, ii: number) =>
                                                                    ii === itemIdx ? { ...it, description: e.target.value } : it
                                                                ),
                                                            }
                                                            : s
                                                    ),
                                                }
                                                : a
                                        );
                                        // Merge works by Area/Subarea
                                        const mergeWorks = (oldAreas: any[], newAreas: any[]) => {
                                            return newAreas.map((area: any, i: number) => {
                                                if (!oldAreas[i]) return area;
                                                return {
                                                    ...area,
                                                    subareas: area.subareas.map((sub: any, j: number) => {
                                                        if (!oldAreas[i].subareas[j]) return sub;
                                                        return {
                                                            ...sub,
                                                            items: sub.items
                                                        };
                                                    })
                                                };
                                            });
                                        };
                                        const merged = { ...data, siteAreas: mergeWorks(data.siteAreas, updatedSiteAreas) };
                                        dispatch(setSiteVisit(merged));
                                        const areaData = merged.siteAreas[areaIdx];
                                        const formatted = formatAreaData(areaData);
                                        dispatch(fetchSiteWorks(formatted));
                                    }
                                }}
                                className="mb-1 bg-white/80 placeholder:text-gray-400 text-sm"
                                placeholder="Subarea description"
                                rows={2}
                            />
                            <div className="flex gap-2 w-full mb-1">
                                <Input
                                    value={item.dimensions || ''}
                                    onFocus={() => {
                                        prevQuantityRef.current[item.id] = item.dimensions || '';
                                    }}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        onUpdate({
                                            siteAreas: data.siteAreas.map((a: any, i: number) =>
                                                i === areaIdx
                                                    ? {
                                                        ...a,
                                                        subareas: a.subareas.map((s: any, si: number) =>
                                                            si === subIdx
                                                                ? {
                                                                    ...s,
                                                                    items: s.items.map((it: any, ii: number) =>
                                                                        ii === itemIdx ? { ...it, dimensions: e.target.value } : it
                                                                    ),
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            ),
                                        });
                                    }}
                                    onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                                        const prevValue = prevQuantityRef.current[item.id] || '';
                                        if (prevValue !== e.target.value) {
                                            const updatedSiteAreas = data.siteAreas.map((a: any, i: number) =>
                                                i === areaIdx
                                                    ? {
                                                        ...a,
                                                        subareas: a.subareas.map((s: any, si: number) =>
                                                            si === subIdx
                                                                ? {
                                                                    ...s,
                                                                    items: s.items.map((it: any, ii: number) =>
                                                                        ii === itemIdx ? { ...it, dimensions: e.target.value } : it
                                                                    ),
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            );
                                            // Merge works by Area/Subarea
                                            const mergeWorks = (oldAreas: any[], newAreas: any[]) => {
                                                return newAreas.map((area: any, i: number) => {
                                                    if (!oldAreas[i]) return area;
                                                    return {
                                                        ...area,
                                                        subareas: area.subareas.map((sub: any, j: number) => {
                                                            if (!oldAreas[i].subareas[j]) return sub;
                                                            return {
                                                                ...sub,
                                                                items: sub.items
                                                            };
                                                        })
                                                    };
                                                });
                                            };
                                            const merged = { ...data, siteAreas: mergeWorks(data.siteAreas, updatedSiteAreas) };
                                            dispatch(setSiteVisit(merged));
                                            const areaData = merged.siteAreas[areaIdx];
                                            const formatted = formatAreaData(areaData);
                                            dispatch(fetchSiteWorks(formatted));
                                        }
                                    }}
                                    className="bg-white/80 placeholder:text-gray-400 text-sm w-2/3"
                                    placeholder="Dimensions / Quantity"
                                />
                                <Input
                                    value={item.udm || ''}
                                    onFocus={() => {
                                        prevUdmRef.current[item.id] = item.udm || '';
                                    }}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        onUpdate({
                                            siteAreas: data.siteAreas.map((a: any, i: number) =>
                                                i === areaIdx
                                                    ? {
                                                        ...a,
                                                        subareas: a.subareas.map((s: any, si: number) =>
                                                            si === subIdx
                                                                ? {
                                                                    ...s,
                                                                    items: s.items.map((it: any, ii: number) =>
                                                                        ii === itemIdx ? { ...it, udm: e.target.value } : it
                                                                    ),
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            ),
                                        });
                                    }}
                                    onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                                        const prevValue = prevUdmRef.current[item.id] || '';
                                        if (prevValue !== e.target.value) {
                                            const updatedSiteAreas = data.siteAreas.map((a: any, i: number) =>
                                                i === areaIdx
                                                    ? {
                                                        ...a,
                                                        subareas: a.subareas.map((s: any, si: number) =>
                                                            si === subIdx
                                                                ? {
                                                                    ...s,
                                                                    items: s.items.map((it: any, ii: number) =>
                                                                        ii === itemIdx ? { ...it, udm: e.target.value } : it
                                                                    ),
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            );
                                            dispatch(setSiteVisit({ siteAreas: updatedSiteAreas }));
                                            const areaData = updatedSiteAreas[areaIdx];
                                            const formatted = formatAreaData(areaData);
                                            dispatch(fetchSiteWorks(formatted));
                                        }
                                    }}
                                    className="bg-white/80 placeholder:text-gray-400 text-sm w-1/3"
                                    placeholder="UDM"
                                />
                            </div>
   
                        </div>
                    </div>
                ))}
                {/* Add photo button at the bottom */}
                <div className="flex flex-col justify-start items-start mt-2 relative">
                    {!analyzing && (
                        <button
                            className="w-32 h-32 border border-dashed hover:border-gray-300 rounded-xl flex items-center justify-center text-primary hover:text-gray-400 border-primary transition-colors"
                            onClick={() => setPhotoPopover((v) => !v)}
                            type="button"
                            id={`add-photo-btn-${areaIdx}-${subIdx}`}
                        >
                            <Plus className="h-6 w-6" />
                        </button>
                    )}
                    {/* Photo popover directly under the button, closes on outside click */}
                    {photoPopover && !analyzing && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setPhotoPopover(false)}
                                aria-hidden="true"
                            />
                            <div className="absolute left-0 top-full mt-2 z-50 bg-white border rounded-xl shadow-lg p-4 flex flex-col gap-2 min-w-[10rem]">
                                <Button variant="outline" className="flex items-center gap-2" onClick={() => {
                                    setLivePhotoModal(true);
                                    setPhotoPopover(false);
                                    setTimeout(handleStartCamera, 100);
                                }}><Camera className="h-5 w-5" />Live photo</Button>
                                <Button variant="outline" className="flex items-center gap-2" onClick={() => {
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                    fileInputRef.current?.click();
                                }}><Upload className="h-5 w-5" />Upload</Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0) return;
                                        setAnalyzing(true);
                                        setPhotoPopover(false);
                                        let newItems: any[] = [];
                                        for (let i = 0; i < files.length; i++) {
                                            const file = files[i];
                                            let url: string | undefined;
                                            let isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
                                            let uploadFile: File | Blob = file;
                                            let uploadFileName = file.name;
                                            if (isHeic) {
                                                try {
                                                    const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
                                                    url = URL.createObjectURL(blob as Blob);
                                                    uploadFile = blob as Blob;
                                                    uploadFileName = file.name.replace(/\.heic$/i, '.jpg');
                                                } catch (err) {
                                                    url = undefined;
                                                }
                                            } else {
                                                url = await new Promise<string>((resolve) => {
                                                    const reader = new FileReader();
                                                    reader.onload = ev => resolve(ev.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                });
                                            }
                                            let description = '';
                                            if (data.aiConsent && url) {
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', uploadFile, uploadFileName);
                                                    const result = await dispatch(analyzeImages(formData)).unwrap();
                                                    if ((result as any).answer) description = (result as any).answer;
                                                } catch (err) {
                                                    description = '';
                                                }
                                            }
                                            newItems.push({
                                                id: `item-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                                                status: '',
                                                dimensions: '',
                                                udm: '',
                                                quantity: '',
                                                description,
                                                photos: [url ? { url, fileName: uploadFileName } : { url: '', fileName: uploadFileName, error: 'Unsupported HEIC format' }]
                                            });
                                        }
                                        onUpdate({
                                            siteAreas: data.siteAreas.map((a: any, idx: number) =>
                                                idx === areaIdx
                                                    ? {
                                                        ...a,
                                                        subareas: a.subareas.map((s: any, si: number) =>
                                                            si === subIdx
                                                                ? {
                                                                    ...s,
                                                                    items: [
                                                                        ...(s.items || []),
                                                                        ...newItems
                                                                    ]
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            ),
                                        });
                                        setAnalyzing(false);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Live photo modal */}
            {livePhotoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
                        <video ref={videoRef} autoPlay playsInline className="w-64 h-48 rounded mb-4 bg-black" />
                        <div className="flex gap-2">
                            <Button onClick={handleCapturePhoto} className="btn-primary">Capture Photo</Button>
                            <Button onClick={() => {
                                setLivePhotoModal(false);
                                if (videoRef.current && videoRef.current.srcObject) {
                                    (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                                    videoRef.current.srcObject = null;
                                }
                            }}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubareaCard;
