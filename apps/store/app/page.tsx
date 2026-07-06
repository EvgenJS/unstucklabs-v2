import { Hero } from "../components/landing/Hero";
import { PainPoints } from "../components/landing/PainPoints";
import { ValueProps } from "../components/landing/ValueProps";
import { HowItWorks } from "../components/landing/HowItWorks";
import { AppPreview } from "../components/landing/AppPreview";
import { CoCreation } from "../components/landing/CoCreation";
import { FinalCta } from "../components/landing/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PainPoints />
      <ValueProps />
      <HowItWorks />
      <AppPreview />
      <CoCreation />
      <FinalCta />
    </>
  );
}
