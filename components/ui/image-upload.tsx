"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload the file to the 'assets' bucket
      // Note: Make sure the 'assets' bucket is created in Supabase and has public access for downloads
      const { error: uploadError, data } = await supabase.storage
        .from("assets")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("ไม่สามารถอัปโหลดรูปภาพได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง Storage");
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("assets").getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-[150px] h-[150px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={onRemove}
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img
              src={value}
              alt="Uploaded image"
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-[150px] h-[150px] rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] mt-2 font-bold text-muted-foreground uppercase tracking-widest">
                  แนบรูปภาพ
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
