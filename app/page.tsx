// file: app/page.tsx
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";
import {
  CheckCircle,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import { LandingHeader } from "@/components/ui/layout/LandingHeader";

/**
 * Advanced SEO Metadata
 */
export const metadata: Metadata = {
  title: "No-BS Business Tracker | Stop Guessing, Start Tracking",
  description:
    "The No-BS Business Tracker replaces expensive CRMs for solo entrepreneurs. Track daily actions, pipeline, and financials with no fluff.",
  keywords: [
    "solo entrepreneur",
    "business tracker",
    "crm",
    "no-bs",
    "financial tracker",
    "pipeline management",
  ],
  openGraph: {
    title: "No-BS Business Tracker | Stop Guessing, Start Tracking",
    description:
      "The No-BS Business Tracker replaces expensive CRMs for solo entrepreneurs.",
    url: "https://your-domain.com", // TODO: Change this
    siteName: "No-BS Business Tracker",
    images: [
      {
        url: "https://your-domain.com/og-image.png", // TODO: Create and add this
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "No-BS Business Tracker | Stop Guessing, Start Tracking",
    description:
      "The No-BS Business Tracker replaces expensive CRMs for solo entrepreneurs.",
    images: ["https://your-domain.com/og-image.png"], // TODO: Create and add this
  },
};

/**
 * Main Landing Page (React Server Component)
 */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
              Stop Guessing.
              <br />
              <span className="text-primary">Start Tracking.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-secondary">
              The No-BS Business Tracker is your complete operating system.
              Replace expensive, confusing CRMs and track what actually matters.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Started for Free
                </Button>
              </SignUpButton>
            </div>
            <p className="mt-4 text-sm text-secondary">
              No gurus, just grit. And the tools to back it up.
            </p>
          </div>
        </section>

        {/* --- Features Section --- */}
        <section className="w-full py-20 md:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
              An OS for the One-Man-Band
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-center text-secondary">
              We track the three pillars of your business: Action, Pipeline, and
              Money.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<CheckCircle className="w-8 h-8 text-primary" />}
                title="Daily Action Log"
                description="Did you do the work? Log your daily approaches, jobs, and revenue. Data over feelings."
              />
              <FeatureCard
                icon={<Users className="w-8 h-8 text-primary" />}
                title="Customer Pipeline"
                description="Never let a lead go cold. Manage all your active leads, follow-ups, and repeat customers in one place."
              />
              <FeatureCard
                icon={<DollarSign className="w-8 h-8 text-primary" />}
                title="Simple Financials"
                description="Know your numbers, no accounting degree required. Track monthly revenue, expenses, and profit margin."
              />
            </div>
          </div>
        </section>

        {/* --- CTA Section --- */}
        <section className="w-full py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Stop Paying for Fluff.
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-lg text-secondary">
              Get the tools you actually need to build your business from $0 to
              LLC.
            </p>
            <div className="mt-8">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Tracking Today
                </Button>
              </SignUpButton>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="w-full py-8 bg-muted border-t">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-secondary">
            © {new Date().getFullYear()} No-BS Business Tracker. All rights
            reserved.
          </p>
          <p className="text-sm text-primary font-medium">
            No Gurus, Just Grit.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Feature Card Sub-component (RSC)
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-secondary">{description}</p>
    </div>
  );
}