import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Camera, Upload } from "lucide-react";
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

const SubareaCard: React.FC<SubareaCardProps> = ({ sub, areaIdx, subIdx, onUpdate, data, setGeneratingDesc }) => {
  const [photoPopover, setPhotoPopover] = useState(false);
  const [livePhotoModal, setLivePhotoModal] = useState(false);
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
        onUpdate({
          siteAreas: data.siteAreas.map((a: any, i: number) =>
            i === areaIdx
              ? {
                  ...a,
                  subareas: a.subareas.map((s: any, si: number) =>
                    si === subIdx ? { ...s, photos: [...(s.photos || []), { url }] } : s
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
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex flex-row items-center gap-4 mb-4">
        <Input
          value={sub.name}
          onChange={e => onUpdate({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, subareas: a.subareas.map((s: any, si: number) => si === subIdx ? { ...s, name: e.target.value } : s) } : a) })}
          className="flex-1 font-medium bg-white/80 placeholder:text-gray-400 text-lg"
          placeholder="Subarea name"
        />
        <Button variant="destructive" size="sm" className="ml-2" onClick={() => onUpdate({ siteAreas: data.siteAreas.map((a: any, i: number) => i === areaIdx ? { ...a, subareas: a.subareas.filter((_: any, si: number) => si !== subIdx) } : a) })}>Remove Subarea</Button>
      </div>
      {/* Photo grid */}
      <div className="flex mb-4">
        <div className="flex gap-4 flex-wrap">
          {sub.photos?.map((photo: any, pIdx: number) => (
            <div key={pIdx} className="relative group flex flex-col items-center bg-gray-50 rounded-xl border p-2 w-56 mb-2">
              <img
                src={photo.url}
                alt="Subarea"
                className="w-40 h-40 object-cover rounded-xl border mb-2 bg-gray-200"
                style={{ objectFit: 'cover' }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1"
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
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Input
                value={photo.statusDescription || ''}
                onChange={e => {
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
                className="mb-1 bg-white/80 placeholder:text-gray-400 text-xs"
                placeholder="Site status"
              />
              <Input
                value={photo.dimensions || ''}
                onChange={e => {
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
                className="mb-1 bg-white/80 placeholder:text-gray-400 text-xs"
                placeholder="Dimensions"
              />
              <div className="flex gap-2 w-full mb-1">
                <Input
                  value={photo.udm || ''}
                  onChange={e => {
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
                  className="w-1/2 bg-white/80 placeholder:text-gray-400 text-xs"
                  placeholder="UDM"
                />
                <Input
                  value={photo.quantity || ''}
                  onChange={e => {
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
                  className="w-1/2 bg-white/80 placeholder:text-gray-400 text-xs"
                  placeholder="Quantity"
                />
              </div>
              <Textarea
                value={photo.description || ''}
                onChange={e => {
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
                className="bg-white/80 placeholder:text-gray-400 text-xs"
                placeholder="Area description"
                rows={2}
              />
            </div>
          ))}
        </div>
        {/* Add photo button always on the right */}
        <div className="flex flex-col justify-start ml-4">
          <button
            className="w-24 h-24 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors"
            onClick={() => setPhotoPopover(true)}
            type="button"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        {/* Photo popover */}
        {photoPopover && (
          <div className="absolute z-50 bg-white border rounded-xl shadow-lg p-4 flex flex-col gap-2 right-0">
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
                  const reader = new FileReader();
                  reader.onload = ev => {
                    onUpdate({
                      siteAreas: data.siteAreas.map((a: any, i: number) =>
                        i === areaIdx
                          ? {
                              ...a,
                              subareas: a.subareas.map((s: any, si: number) =>
                                si === subIdx ? { ...s, photos: [...(s.photos || []), { url: ev.target?.result }] } : s
                              ),
                            }
                          : a
                      ),
                    });
                    setPhotoPopover(false);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        )}
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
