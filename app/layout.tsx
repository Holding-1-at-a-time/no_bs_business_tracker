// file: app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "../components/providers/ConvexClientProvider";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css"; // Import the new global styles

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ConvexClientProvider>
        <html lang="en" className={inter.className}>
          <body>
            {children}
            <Toaster richColors />
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}