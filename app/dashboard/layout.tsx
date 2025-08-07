'use client'

import { Sidebar } from "@/components/Sidebar";
import { DarkModeProvider } from '@/app/context/DarkModeContext';
import { Provider } from "react-redux";
import { store } from "@/lib/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <DarkModeProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar>
            <main className="w-full">{children}</main>
          </Sidebar>
        </div>
      </DarkModeProvider>
    </Provider>
  );
}