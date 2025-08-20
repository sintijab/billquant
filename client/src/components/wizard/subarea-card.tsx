import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Camera, Upload } from "lucide-react";
import React from "react";

interface SubareaCardProps {
    sub: any;
    areaIdx: number;
    subIdx: number;
    onUpdate: (updates: any) => void;
    data: any;
    setGeneratingDesc: (id: string | null) => void;
}


import { useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { setSiteVisit } from '@/features/wizardSlice';
import Loader from "../ui/loader";

const SubareaCard: React.FC<SubareaCardProps> = ({ sub, areaIdx, subIdx, onUpdate, data, setGeneratingDesc }) => {
    const dispatch = useDispatch();
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

    const handleCapturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const url = canvas.toDataURL("image/png");
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const fileName = `LivePhoto_${timestamp}.png`;
                onUpdate({
                    siteAreas: data.siteAreas.map((a: any, i: number) =>
                        i === areaIdx
                            ? {
                                ...a,
                                subareas: a.subareas.map((s: any, si: number) =>
                                    si === subIdx ? { ...s, photos: [...(s.photos || []), { url, fileName }] } : s
                                ),
                            }
                            : a
                    ),
                });
            }
        }
        setLivePhotoModal(false);
        // Stop camera
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 relative">
            {analyzing && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/60 rounded-2xl">
                    <Loader size="xxs" />
                </div>
            )}
            <div className="flex flex-row items-center gap-4 mb-4">
                                <Input
                                    value={sub.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, subareas: a.subareas.map((s: any, si: number) => si === subIdx ? { ...s, name: e.target.value } : s) } : a) })}
                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                        const updated = { siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, subareas: a.subareas.map((s: any, si: number) => si === subIdx ? { ...s, name: e.target.value } : s) } : a) };
                                        dispatch(setSiteVisit(updated));
                                    }}
                                    className="flex-1 font-medium bg-white/80 placeholder:text-gray-400 text-lg"
                                    placeholder="Subarea name"
                                />
                <Button
                    variant="secondary"
                    size="icon"
                    className="ml-2 w-8 h-8 p-0 rounded-full flex items-center justify-center shadow-md border-0 bg-white text-primary-dark hover:bg-primary-dark hover:text-white transition-colors"
                    onClick={() => {
                        const updated = {
                            siteAreas: data.siteAreas.map((a: any, i: number) =>
                                i === areaIdx
                                    ? { ...a, subareas: a.subareas.filter((_: any, si: number) => si !== subIdx) }
                                    : a
                            )
                        };
                        onUpdate(updated);
                        dispatch(setSiteVisit(updated));
                    }}
                    aria-label="Remove Subarea"
                >
                    <span className="sr-only">Remove Subarea</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Button>
            </div>
            {/* Photo grid */}
            <div className="flex flex-col gap-4 mb-4">
                {sub.photos?.map((photo: any, pIdx: number) => (
                    <div key={pIdx} className="flex flex-row items-start bg-gray-50 rounded-xl border p-2 w-full relative min-h-[12rem]" style={{ minHeight: '200px' }}>
                        <img
                            src={photo.url}
                            alt="Subarea"
                            className="w-40 h-full max-h-[300px] object-cover rounded-xl border bg-gray-200"
                            style={{ objectFit: 'cover', height: '100%', maxHeight: '300px' }}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 p-1 rounded-full bg-white text-primary-dark hover:bg-primary-dark hover:text-white focus:outline-none transition-colors"
                            aria-label="Remove photo"
                            onClick={() => {
                                const updated = {
                                    siteAreas: data.siteAreas.map((a: any, i: number) =>
                                        i === areaIdx
                                            ? {
                                                ...a,
                                                subareas: a.subareas.map((s: any, si: number) =>
                                                    si === subIdx
                                                        ? { ...s, photos: s.photos.filter((_: any, pi: number) => pi !== pIdx) }
                                                        : s
                                                )
                                            }
                                            : a
                                    )
                                };
                                onUpdate(updated);
                                dispatch(setSiteVisit(updated));
                            }}
                        >
                            <span className="sr-only">Remove photo</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                        <div className="flex-1 flex flex-col gap-1 pl-4">
                            {/* First line: file name (left), delete icon (right) */}
                            <div className="flex flex-row items-center justify-between mb-1">
                                <span className="text-sm font-normal text-gray-700 truncate max-w-[60%]">
                                    {photo.fileName || 'Photo'}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 p-0 flex items-center justify-center text-primary-dark hover:text-primary-dark/70 transition-colors group bg-transparent border-none shadow-none"
                                    onClick={() => {
                                        onUpdate({
                                            siteAreas: data.siteAreas.map((a: any, i: number) =>
                                                i === areaIdx
                                                    ? {
                                                        ...a,
                                                        subareas: a.subareas.map((s: any, si: number) =>
                                                            si === subIdx
                                                                ? { ...s, photos: s.photos.filter((_: any, pi: number) => pi !== pIdx) }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            ),
                                        });
                                    }}
                                    aria-label="Remove Subarea"
                                >
                                    <span className="sr-only">Remove Subarea</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary-dark group-hover:text-white transition-colors" style={{ background: 'none', border: 'none', boxShadow: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" stroke="currentColor" />
                                    </svg>
                                </Button>
                            </div>
                            <Input
                                value={photo.statusDescription || ''}
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
                                                                photos: s.photos.map((p: any, pi: number) =>
                                                                    pi === pIdx ? { ...p, statusDescription: e.target.value } : p
                                                                ),
                                                            }
                                                            : s
                                                    ),
                                                }
                                                : a
                                        ),
                                    });
                                }}
                                className="mb-1 bg-white/80 placeholder:text-gray-400 text-sm"
                                placeholder="Site status"
                            />
                            <Input
                                value={photo.dimensions || ''}
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
                                                                photos: s.photos.map((p: any, pi: number) =>
                                                                    pi === pIdx ? { ...p, dimensions: e.target.value } : p
                                                                ),
                                                            }
                                                            : s
                                                    ),
                                                }
                                                : a
                                        ),
                                    });
                                }}
                                className="mb-1 bg-white/80 placeholder:text-gray-400 text-sm"
                                placeholder="Dimensions"
                            />
                            <div className="flex gap-2 w-full mb-1">
                                <Input
                                    value={photo.udm || ''}
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
                                                                    photos: s.photos.map((p: any, pi: number) =>
                                                                        pi === pIdx ? { ...p, udm: e.target.value } : p
                                                                    ),
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            ),
                                        });
                                    }}
                                    className="w-1/2 bg-white/80 placeholder:text-gray-400 text-sm"
                                    placeholder="UDM"
                                />
                                <Input
                                    value={photo.quantity || ''}
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
                                                                    photos: s.photos.map((p: any, pi: number) =>
                                                                        pi === pIdx ? { ...p, quantity: e.target.value } : p
                                                                    ),
                                                                }
                                                                : s
                                                        ),
                                                    }
                                                    : a
                                            ),
                                        });
                                    }}
                                    className="w-1/2 bg-white/80 placeholder:text-gray-400 text-sm"
                                    placeholder="Quantity"
                                />
                            </div>
                            <Textarea
                                value={photo.description || ''}
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
                                                                photos: s.photos.map((p: any, pi: number) =>
                                                                    pi === pIdx ? { ...p, description: e.target.value } : p
                                                                ),
                                                            }
                                                            : s
                                                    ),
                                                }
                                                : a
                                        ),
                                    });
                                }}
                                className="bg-white/80 placeholder:text-gray-400 text-sm"
                                placeholder="Subarea description"
                                rows={2}
                            />
                        </div>
                    </div>
                ))}
                {/* Add photo button at the bottom */}
                <div className="flex flex-col justify-start items-start mt-2 relative">
                    {!analyzing && (
                        <button
                            className="w-32 h-32 border border-dashed hover:border-gray-300 rounded-xl flex items-center justify-center text-primary hover:text-gray-400 border-primary transition-colors"
                            onClick={() => setPhotoPopover(true)}
                            type="button"
                            id={`add-photo-btn-${areaIdx}-${subIdx}`}
                        >
                            <Plus className="h-6 w-6" />
                        </button>
                    )}
                    {/* Photo popover directly under the button */}
                    {photoPopover && !analyzing && (
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
                            <Button variant="ghost" onClick={() => setPhotoPopover(false)}>Close</Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAnalyzing(true);
                                        setPhotoPopover(false);
                                        const reader = new FileReader();
                                        reader.onload = async ev => {
                                            const url = ev.target?.result;
                                            let description = '';
                                            if (data.aiConsent) {
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    const response = await fetch('http://127.0.0.1:8000/analyze_image_moondream', {
                                                        method: 'POST',
                                                        body: formData
                                                    });
                                                    const result = await response.json();
                                                    if (result.answer) description = result.answer;
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
                                                                si === subIdx ? { ...s, photos: [...(s.photos || []), { url, fileName: file.name, description }] } : s
                                                            ),
                                                        }
                                                        : a
                                                ),
                                            });
                                            setAnalyzing(false);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
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
