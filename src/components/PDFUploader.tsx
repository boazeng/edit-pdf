import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
}

export const PDFUploader = ({ onFileSelect }: PDFUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? 'active' : ''} cursor-pointer`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg">גרור קובץ PDF לכאן או לחץ לבחירה</p>
        <p className="mt-2 text-sm text-gray-500">PDF בלבד</p>
      </div>
    </div>
  );
};