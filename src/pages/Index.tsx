
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PDFUploader } from "@/components/PDFUploader";
import { PDFForm } from "@/components/PDFForm";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.includes("pdf")) {
      toast({
        title: "שגיאה",
        description: "אנא העלה קובץ PDF בלבד",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
    toast({
      title: "הקובץ הועלה בהצלחה",
      description: selectedFile.name,
    });
  };

  return (
    <div className="min-h-screen p-8 bg-background font-heebo">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
        <h1 className="text-3xl font-bold text-center mb-8" lang="he">עורך PDF של יעל</h1>
        
        <Card className="p-6">
          {!file ? (
            <PDFUploader onFileSelect={handleFileSelect} />
          ) : (
            <PDFForm file={file} onReset={() => setFile(null)} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
