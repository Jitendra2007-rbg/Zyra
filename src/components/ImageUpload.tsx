import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    bucket?: string;
}

export const ImageUpload = ({
    value,
    onChange,
    disabled,
    bucket = "products"
}: ImageUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(value);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("Image size should be less than 5MB");
            return;
        }

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;

            setPreview(publicUrl);
            onChange(publicUrl);
            toast.success("Image uploaded successfully");

        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        setPreview(undefined);
        onChange("");
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4 w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                disabled={disabled || isUploading}
            />

            {preview ? (
                <div className="relative aspect-square max-h-[300px] w-full max-w-[300px] overflow-hidden rounded-lg border bg-muted group">
                    <img
                        src={preview}
                        alt="Product preview"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-90 hover:opacity-100 transition-opacity"
                            onClick={handleRemove}
                            disabled={disabled || isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={triggerUpload}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                        flex flex-col items-center justify-center gap-2 min-h-[200px]
                        ${disabled || isUploading
                            ? "border-muted-foreground/20 bg-muted/10 cursor-not-allowed"
                            : "border-muted-foreground/30 hover:border-primary hover:bg-muted/10"
                        }
                    `}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="bg-primary/10 p-4 rounded-full mb-2">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-sm font-medium">Click to upload image</p>
                            <p className="text-xs text-muted-foreground">
                                SVG, PNG, JPG or GIF (max. 5MB)
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
