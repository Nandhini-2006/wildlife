import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { FileImage, UploadCloud } from "lucide-react";

interface ImageUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export default function ImageUploader({ onFileSelected, disabled }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  return (
    <div
      className={`uploader ${isDragActive ? "uploader--active" : ""} ${
        disabled ? "uploader--disabled" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleInputChange}
        className="uploader__input"
        disabled={disabled}
      />
      <div className="uploader__icon">
        <UploadCloud size={30} strokeWidth={1.25} />
      </div>
      <p className="uploader__title">Drag and drop an image, or click to browse</p>
      <p className="uploader__hint">
        <FileImage size={14} strokeWidth={1.5} /> Supports JPG, PNG, WEBP, BMP
      </p>
    </div>
  );
}
