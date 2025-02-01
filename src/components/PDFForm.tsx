import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Folder } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFDocument, StandardFonts } from 'pdf-lib';

interface PDFFormProps {
  file: File;
  onReset: () => void;
}

export const PDFForm = ({ file, onReset }: PDFFormProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    marginLeft: "",
    marginBottom: "",
    fileName: "",
    startPage: "1", // New field for starting page number
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      const startPageNum = parseInt(formData.startPage) || 1;
      
      pages.forEach((page, index) => {
        const { height } = page.getSize();
        const marginLeft = parseFloat(formData.marginLeft) * 28.35;
        const marginTop = parseFloat(formData.marginBottom) * 28.35;
        
        // Draw the title
        page.drawText(formData.title, {
          x: marginLeft,
          y: height - marginTop,
          size: 12,
          font: font,
        });

        // Draw page numbers below the title, starting from the specified page number
        const pageText = `${startPageNum + index}/${startPageNum + totalPages - 1}`;
        page.drawText(pageText, {
          x: marginLeft,
          y: height - marginTop - 20, // 20 points below the title
          size: 10,
          font: font,
        });
      });
      
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const fileUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = fileUrl;
      
      const downloadFileName = formData.fileName || "processed-document.pdf";
      link.download = downloadFileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(fileUrl);

      toast({
        title: "הקובץ עובד בהצלחה",
        description: `הקובץ ${downloadFileName} יורד כעת למחשב שלך`,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "שגיאה בעיבוד הקובץ",
        description: "אנא נסה שנית",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDefaultDownloadPath = () => {
    const isWindows = navigator.platform.includes('Win');
    const isMac = navigator.platform.includes('Mac');
    
    if (isWindows) {
      return 'C:\\Users\\[Username]\\Downloads';
    } else if (isMac) {
      return '/Users/[Username]/Downloads';
    } else {
      return '~/Downloads';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Folder className="h-4 w-4" />
        <AlertDescription>
          הקובץ יישמר בתיקיית ההורדות שלך: {getDefaultDownloadPath()}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">כותרת</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="הכנס את הכותרת הרצויה"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="marginLeft">מרחק משמאל (ס"מ)</Label>
            <Input
              id="marginLeft"
              type="number"
              step="0.1"
              min="0"
              value={formData.marginLeft}
              onChange={(e) => setFormData({ ...formData, marginLeft: e.target.value })}
              placeholder="לדוגמה: 2.5"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="marginBottom">מרחק מלמעלה (ס"מ)</Label>
            <Input
              id="marginBottom"
              type="number"
              step="0.1"
              min="0"
              value={formData.marginBottom}
              onChange={(e) => setFormData({ ...formData, marginBottom: e.target.value })}
              placeholder="לדוגמה: 1.5"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="startPage">מספר עמוד התחלתי</Label>
          <Input
            id="startPage"
            type="number"
            min="1"
            value={formData.startPage}
            onChange={(e) => setFormData({ ...formData, startPage: e.target.value })}
            placeholder="לדוגמה: 1"
            required
          />
        </div>

        <div>
          <Label htmlFor="fileName">שם הקובץ</Label>
          <Input
            id="fileName"
            value={formData.fileName}
            onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
            placeholder="שם הקובץ (לדוגמה: document.pdf)"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button type="button" variant="outline" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          חזרה
        </Button>
        
        <Button type="submit" disabled={isProcessing}>
          <Download className="mr-2 h-4 w-4" />
          {isProcessing ? "מעבד..." : "הורד PDF"}
        </Button>
      </div>
    </form>
  );
};