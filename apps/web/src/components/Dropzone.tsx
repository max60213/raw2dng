import { useRef } from "react";

interface DropzoneProps {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

export function Dropzone({ disabled, onFiles }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className={`panel dropzone ${disabled ? "dropzone-disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <div>
        <h2>Drop RAW files here</h2>
        <p>Runs fully in-browser. Mobile-safe limits are enforced before conversion starts.</p>
      </div>
      <button
        className="primary-button"
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose files
      </button>
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept=".cr2,.cr3,.nef,.arw,.raf,.rw2,.orf,.dng"
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
      />
    </section>
  );
}
