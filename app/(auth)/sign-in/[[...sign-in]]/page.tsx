import { SignIn } from "@clerk/nextjs";
import { Cpu, Share2, FileText, Layers } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default function SignInPage() {
  return (
    <main className="min-h-screen font-sans flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between px-14 py-10 bg-surface">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <Layers className="h-4 w-4 text-[#080809]" />
          </div>
          <span className="text-copy-primary font-semibold text-sm tracking-tight">
            Pulse AI
          </span>
        </div>

        {/* Heading + features */}
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-copy-primary leading-tight mb-4">
            Design systems at the
            <br />
            speed of thought.
          </h1>
          <p className="text-copy-secondary text-sm leading-relaxed mb-10">
            Describe your architecture in plain English. Pulse AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>
          <ul className="space-y-6">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-xl bg-brand-dim flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-copy-primary font-medium text-sm mb-0.5">
                    {title}
                  </p>
                  <p className="text-copy-muted text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-copy-faint text-xs">
          © 2026 Pulse AI. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-base">
        <SignIn />
      </div>
    </main>
  );
}
