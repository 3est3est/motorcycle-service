"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, Loader2, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, folder = "general" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage.from("assets").upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError("ไม่สามารถอัปโหลดได้ โปรดลองอีกครั้ง");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("assets").getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError("เกิดข้อผิดพลาดทางเทคนิค");
    } finally {
      setLoading(false);
    }
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-4 w-fit">
      <div className="relative group">
        {value ? (
          <div className="relative w-40 h-40 rounded-4xl overflow-hidden border-2 border-primary/20 shadow-xl group-hover:border-primary/40 transition-all">
            <img src={value} alt="Uploaded image" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onRemove}
                className="h-10 w-10 rounded-xl shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center w-40 h-40 rounded-4xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer relative group/upload overflow-hidden",
              loading && "cursor-not-allowed opacity-70",
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
            />
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Uploading</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-sm group-hover/upload:scale-110 transition-transform duration-500">
                  <Camera className="h-6 w-6 text-muted-foreground group-hover/upload:text-primary transition-colors" strokeWidth={1.5} />
                </div>
                <span className="text-[9px] mt-4 font-black text-muted-foreground/60 uppercase tracking-[0.2em] group-hover/upload:text-primary/70 transition-colors">
                  Upload Photo
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold uppercase text-destructive tracking-wider px-1 bg-destructive/5 py-1 rounded-md text-center">{error}</p>
      )}
    </div>
  );
}
