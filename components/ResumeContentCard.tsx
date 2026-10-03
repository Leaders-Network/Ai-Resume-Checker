import { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Resume {
  fileName: string;
  content: string;
  pdfUrl?: string | Blob;
}

function ResumeContentCard({ resume }: { resume: Resume }) {
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (resume.pdfUrl && typeof resume.pdfUrl !== "string" && resume.pdfUrl instanceof Blob) {
      const url = URL.createObjectURL(resume.pdfUrl);
      setPdfObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfObjectUrl(null);
    }
  }, [resume.pdfUrl]);

  const pdfFile =
    resume.pdfUrl && typeof resume.pdfUrl !== "string" && resume.pdfUrl instanceof Blob
      ? pdfObjectUrl
      : resume.pdfUrl;

  return (
    <Card className="overflow-hidden border-2 border-border  shadow-md">
      <CardHeader className="bg-muted/40 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg truncate text-foreground">
          {resume.fileName}
        </CardTitle>
        {pdfFile && (
          <a href={pdfFile ?? "#"} download target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="mt-2 sm:mt-0">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </a>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {pdfFile ? (
          <div className="bg-background rounded-lg border border-border p-2 max-h-[500px] overflow-y-auto flex justify-center">
            <Document file={pdfFile} loading={<span className="text-muted-foreground">Loading PDF...</span>}>
              <Page pageNumber={1} width={500} />
            </Document>
          </div>
        ) : (
          <div className="bg-background rounded-lg border border-border p-6 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {resume.content}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResumeContentCard;