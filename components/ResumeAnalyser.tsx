"use client";
import React, { useState, useRef } from "react";
import { FileText, Search, Download, AlertCircle, Upload } from "lucide-react";
import { PDFDocumentProxy, getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

interface ResumeAnalysis {
  score: number;
  matches: string[];
  suggestions: string[];
  fileContent: string;
}

function ResumeAnalyzer() {
  const [files, setFiles] = useState<File[]>([]);
  const [keywords, setKeywords] = useState("");
  const [analysis, setAnalysis] = useState<Record<string, ResumeAnalysis>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update to handle multiple file selection without replacing
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (uploadedFiles) {
      const validFiles = Array.from(uploadedFiles).filter(
        (file) =>
          file.size <= 10 * 1024 * 1024 && file.type === "application/pdf"
      );

      if (validFiles.length !== uploadedFiles.length) {
        setErrorMessage(
          "One or more files exceed 10MB or are not PDFs. Please upload valid PDF files."
        );
        return;
      }

      // Append new files to existing array, capping at 50 files
      const newFiles = [...files, ...validFiles].slice(0, 50);
      setFiles(newFiles);
      setAnalysis({});
      setErrorMessage("");
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const result = event.target?.result;
        if (!result) {
          reject(new Error("Failed to read file content"));
          return;
        }

        try {
          const pdfDoc: PDFDocumentProxy = await getDocument({ data: result })
            .promise;
          let pdfText = "";
          for (let i = 0; i < pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i + 1);
            const textContent = await page.getTextContent();
            const strings = textContent.items
              .map((item) => ("str" in item ? item.str : null))
              .filter((str): str is string => str !== null);
            pdfText += strings.join(" ") + " ";
          }
          resolve(pdfText);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const analyzeResume = async () => {
    if (!files.length || !keywords.trim()) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const keywordList = keywords
        .toLowerCase()
        .split(",")
        .map((k) => k.trim());
      const newAnalysis: Record<string, ResumeAnalysis> = {};

      for (const file of files) {
        const fileContent = await readFileContent(file);
        const contentLower = fileContent.toLowerCase();

        const matches = keywordList.filter((keyword) =>
          contentLower.includes(keyword)
        );
        const missing = keywordList.filter(
          (keyword) => !contentLower.includes(keyword)
        );
        const score =
          keywordList.length > 0
            ? (matches.length / keywordList.length) * 100
            : 0;

        newAnalysis[file.name] = {
          score,
          matches,
          suggestions: missing.map(
            (keyword) =>
              `Consider adding experience or skills related to "${keyword}"`
          ),
          fileContent,
        };
      }

      setAnalysis(newAnalysis);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      setErrorMessage(
        "There was an error analyzing one or more resumes. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!Object.keys(analysis).length) return;

    for (const [fileName, analysisData] of Object.entries(analysis)) {
      const report = `Resume Analysis Report for ${fileName}
---------------------
Match Score: ${analysisData.score.toFixed(2)}%

Matched Keywords:
${analysisData.matches.map((k) => `- ${k}`).join("\n")}

Suggestions:
${analysisData.suggestions.map((s) => `- ${s}`).join("\n")}

Original Content:
${analysisData.fileContent}
`;

      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-analysis-${fileName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Resume Analyzer
          </h1>

          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resume(s)
              </label>
              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload files</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        multiple
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {`${files.length} file${
                      files.length !== 1 ? "s" : ""
                    } selected (max 50)`}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., javascript, react, typescript"
              />
            </div>

            <button
              onClick={analyzeResume}
              disabled={!files.length || !keywords.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              {isLoading ? "Analyzing..." : "Analyze Resumes"}
            </button>

            {Object.keys(analysis).length > 0 && (
              <div className="mt-6 space-y-4">
                {Object.entries(analysis).map(([fileName, analysisData]) => (
                  <div
                    key={fileName}
                    className="bg-gray-50 p-4 rounded-lg mb-4"
                  >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Analysis Results for {fileName}
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-700">
                          Match Score
                        </h3>
                        <div className="mt-2 relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{ width: `${analysisData.score}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 mt-1">
                            {analysisData.score.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-700">
                          Matched Keywords
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {analysisData.matches.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {analysisData.suggestions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            Suggestions
                          </h3>
                          <ul className="mt-2 space-y-2">
                            {analysisData.suggestions.map(
                              (suggestion, index) => (
                                <li key={index} className="text-gray-600">
                                  • {suggestion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={downloadReport}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download All Reports
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalyzer;