import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadApi } from "@/lib/api";

interface Props {
  /** Current image URL (single) */
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, label = "Imagen", className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (file: File) => {
    setErr("");
    setUploading(true);
    try {
      const url = await uploadApi.upload(file);
      onChange(url);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      {value ? (
        <div className="relative w-full max-w-xs">
          <img
            src={value}
            alt="preview"
            className="h-32 w-full max-w-xs rounded-md object-cover border border-primary/20"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute -right-2 -top-2 rounded-full bg-card border border-primary/30 p-0.5 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-primary/30 bg-background/50 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Subir imagen</span>
            </>
          )}
        </button>
      )}

      {err && <p className="text-xs text-red-400">{err}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
