import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Leaders CV Checker | Screen applicant CVs against job requirements";
const description = "Upload applicant CVs in bulk, score them against the skills, experience, location and certifications a role needs, and compare candidates. CV screening for recruiters and hiring teams in Nigeria and across Africa.";
export const metadata: Metadata = {
  metadataBase: new URL("https://leaderscvchecker.com"),
  title, description,
  openGraph: { title, description, siteName: "Leaders CV Checker", type: "website", locale: "en_NG", url: "https://leaderscvchecker.com" },
  twitter: { card: "summary", title, description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
