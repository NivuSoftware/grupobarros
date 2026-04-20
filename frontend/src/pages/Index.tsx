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
import { useSorteoActivo } from "@/lib/useSorteoActivo";

const Index = () => {
  const { data, loading } = useSorteoActivo();
  const hasSorteo = !loading && data !== null;

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar sorteoData={data} loading={loading} />
      <Hero sorteoData={data} loading={loading} />
      {hasSorteo && <GoldNumbers sorteoData={data} loading={loading} />}
      {hasSorteo && <OrangeNumber sorteoData={data} loading={loading} />}
      <HowItWorks />
      {hasSorteo && <Packs />}
      <Winners />
      <FinalCTA />
      <Footer />
      {hasSorteo && <StickyBuy />}
    </main>
  );
};

export default Index;
