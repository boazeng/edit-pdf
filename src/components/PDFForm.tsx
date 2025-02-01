import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Folder, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // כאן יהיה הקוד לעיבוד ה-PDF
      // לצורך הדגמה, נחכה שנייה אחת
      await new Promise(resolve => setTimeout(resolve, 1000));

      // הגדרת שם ברירת מחדל אם לא הוזן שם קובץ
      const downloadFileName = formData.fileName || "processed-document.pdf";

      toast({
        title: "הקובץ עובד בהצלחה",
        description: `הקובץ ${downloadFileName} יורד כעת למחשב שלך`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בעיבוד הקובץ",
        description: "אנא נסה שנית",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // קביעת נתיב ברירת המחדל בהתאם למערכת ההפעלה
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

      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle>שים לב</AlertTitle>
        <AlertDescription className="mt-2">
          מטעמי אבטחה, הדפדפן יוריד את הקובץ לתיקיית ברירת המחדל להורדות.
          אם ברצונך לשנות את תיקיית ברירת המחדל:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>בכרום: פתח הגדרות {'>'} מתקדם {'>'} הורדות</li>
            <li>בפיירפוקס: פתח הגדרות {'>'} כללי {'>'} הורדות</li>
            <li>בספארי: פתח העדפות {'>'} כללי</li>
          </ul>
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
            <Label htmlFor="marginLeft">מרחק מימין (ס"מ)</Label>
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
            <Label htmlFor="marginBottom">מרחק מלמטה (ס"מ)</Label>
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