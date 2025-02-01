import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Folder, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PDFFormProps {
  file: File;
  onReset: () => void;
}

export const PDFForm = ({ file, onReset }: PDFFormProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [sizeOption, setSizeOption] = useState("original");
  const [customSize, setCustomSize] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    marginLeft: "0.5",
    marginBottom: "1",
    fileName: "",
    startPage: "1",
    pageNumberMarginLeft: "2",
    pageNumberMarginTop: "1",
    pageNumberFontSize: "16",
  });
  const [image, setImage] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: "שגיאה",
          description: "אנא העלה קובץ תמונה בלבד",
          variant: "destructive",
        });
        return;
      }
      setImage(file);
      toast({
        title: "התמונה הועלתה בהצלחה",
        description: file.name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      console.log('Starting PDF processing...');
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      console.log('Processing pages...');
      const pages = pdfDoc.getPages();
      const startPageNum = parseInt(formData.startPage) || 1;

      let pdfImage;
      if (image) {
        const imageBytes = await image.arrayBuffer();
        if (image.type.includes('png')) {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        } else if (image.type.includes('jpeg') || image.type.includes('jpg')) {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        }
      }
      
      pages.forEach((page, index) => {
        const { height, width } = page.getSize();
        const marginLeft = parseFloat(formData.marginLeft) * 28.35;
        const marginTop = parseFloat(formData.marginBottom) * 28.35;
        
        if (pdfImage) {
          const imgDims = pdfImage.scale(0.5);
          page.drawImage(pdfImage, {
            x: marginLeft,
            y: height - marginTop - imgDims.height,
            width: imgDims.width,
            height: imgDims.height,
          });
        }

        if (showTitle && formData.title) {
          page.drawText(formData.title, {
            x: marginLeft,
            y: height - marginTop - (pdfImage ? 100 : 0),
            size: 12,
            font: font,
          });
        }

        const pageText = `-${startPageNum + index}-`;
        const pageNumberMarginLeft = parseFloat(formData.pageNumberMarginLeft) * 28.35 || marginLeft;
        const pageNumberMarginTop = parseFloat(formData.pageNumberMarginTop) * 28.35 || marginTop;
        const pageNumberFontSize = parseInt(formData.pageNumberFontSize) || 10;
        
        page.drawText(pageText, {
          x: pageNumberMarginLeft,
          y: height - pageNumberMarginTop,
          size: pageNumberFontSize,
          font: font,
        });
      });
      
      console.log('Saving PDF...');
      const modifiedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      // אם נבחרה אפשרות של גודל מותאם אישית, נדחס את הקובץ
      if (sizeOption === "custom" && customSize) {
        const targetSizeInBytes = parseFloat(customSize) * 1024 * 1024; // המרה ל-bytes
        const compressionRatio = targetSizeInBytes / modifiedPdfBytes.length;
        
        if (compressionRatio < 1) {
          // נדחס את התמונות והטקסט בקובץ
          const compressedPdfDoc = await PDFDocument.load(modifiedPdfBytes);
          const compressedBytes = await compressedPdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
          });
          
          const blob = new Blob([compressedBytes], { type: 'application/pdf' });
          const fileUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = formData.fileName || "processed-document.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(fileUrl);
        } else {
          // אם הקובץ כבר קטן מהגודל המבוקש, נשמור אותו כמו שהוא
          const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
          const fileUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = formData.fileName || "processed-document.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(fileUrl);
        }
      } else {
        // אם נבחר גודל מקורי, נשמור את הקובץ כמו שהוא
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const fileUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = formData.fileName || "processed-document.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileUrl);
      }

      toast({
        title: "הקובץ עובד בהצלחה",
        description: `הקובץ ${formData.fileName || "processed-document.pdf"} יורד כעת למחשב שלך`,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "שגיאה בעיבוד הקובץ",
        description: error instanceof Error ? error.message : "אנא נסה שנית",
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
          <Label>גודל קובץ</Label>
          <RadioGroup
            value={sizeOption}
            onValueChange={setSizeOption}
            className="flex flex-col space-y-2 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="original" id="original" />
              <Label htmlFor="original">גודל מקורי</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom">גודל מותאם אישית</Label>
            </div>
          </RadioGroup>
          {sizeOption === "custom" && (
            <div className="mt-2">
              <Label htmlFor="customSize">גודל בMB</Label>
              <Input
                id="customSize"
                type="number"
                step="0.1"
                min="0.1"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="לדוגמה: 5"
                required={sizeOption === "custom"}
              />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="showTitle"
              checked={showTitle}
              onCheckedChange={(checked) => setShowTitle(checked as boolean)}
            />
            <Label htmlFor="showTitle">הצג כותרת</Label>
          </div>
          {showTitle && (
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="הכנס את הכותרת הרצויה"
              required={showTitle}
            />
          )}
        </div>

        <div>
          <Label htmlFor="image">תמונה (אופציונלי)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {image && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setImage(null)}
              >
                ✕
              </Button>
            )}
          </div>
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
              placeholder="לדוגמה: 0.5"
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
              placeholder="לדוגמה: 1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pageNumberMarginLeft">מרחק מספר עמוד משמאל (ס"מ)</Label>
            <Input
              id="pageNumberMarginLeft"
              type="number"
              step="0.1"
              min="0"
              value={formData.pageNumberMarginLeft}
              onChange={(e) => setFormData({ ...formData, pageNumberMarginLeft: e.target.value })}
              placeholder="לדוגמה: 2"
            />
          </div>
          
          <div>
            <Label htmlFor="pageNumberMarginTop">מרחק מספר עמוד מלמעלה (ס"מ)</Label>
            <Input
              id="pageNumberMarginTop"
              type="number"
              step="0.1"
              min="0"
              value={formData.pageNumberMarginTop}
              onChange={(e) => setFormData({ ...formData, pageNumberMarginTop: e.target.value })}
              placeholder="לדוגמה: 1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="pageNumberFontSize">גודל פונט מספר העמוד</Label>
          <Input
            id="pageNumberFontSize"
            type="number"
            min="6"
            max="72"
            value={formData.pageNumberFontSize}
            onChange={(e) => setFormData({ ...formData, pageNumberFontSize: e.target.value })}
            placeholder="לדוגמה: 16"
          />
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