import { HeroSection } from "@/components/hero-section";
import { FamilyMembers } from "@/components/family-members";
import { FamilyValues } from "@/components/family-values";
import { GallerySection } from "@/components/gallery-section";
import { EventsTimeline } from "@/components/events-timeline";
import { RemembranceSection } from "@/components/remembrance-section";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Separator />
      <FamilyMembers />
      <Separator />
      <FamilyValues />
      <Separator />
      <GallerySection />
      <Separator />
      <EventsTimeline />
      <RemembranceSection />
    </>
  );
}
