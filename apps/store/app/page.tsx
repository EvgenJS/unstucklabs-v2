import { Hero } from "../components/landing/Hero";
import { PainPoints } from "../components/landing/PainPoints";
import { ValueProps } from "../components/landing/ValueProps";
import { HowItWorks } from "../components/landing/HowItWorks";
import { AppPreview } from "../components/landing/AppPreview";
import { CoCreation } from "../components/landing/CoCreation";
import { FinalCta } from "../components/landing/FinalCta";

// AppPreview fetches live catalog data -- render per-request rather than
// baking a snapshot in at build time (self-hosted persistent server, no
// ISR/serverless infra, see CLAUDE.md).
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PainPoints />
      <AppPreview />
      <ValueProps />
      <HowItWorks />
      <CoCreation />
      <FinalCta />
    </>
  );
}
