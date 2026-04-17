import { Navbar } from "@/components/Navbar";
import { StickyBuy } from "@/components/StickyBuy";
import { Hero } from "@/components/sections/Hero";
import { GoldNumbers } from "@/components/sections/GoldNumbers";
import { OrangeNumber } from "@/components/sections/OrangeNumber";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Packs } from "@/components/sections/Packs";
import { Winners } from "@/components/sections/Winners";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <GoldNumbers />
      <OrangeNumber />
      <HowItWorks />
      <Packs />
      <Winners />
      <FinalCTA />
      <Footer />
      <StickyBuy />
    </main>
  );
};

export default Index;
