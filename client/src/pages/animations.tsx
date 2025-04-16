import Header from "@/components/layout/Header";
import UploadCard from "@/components/animations/UploadCard";

export default function AnimationsPage() {
  return (
    <>
      <Header title="Animations Demo" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Upload Animation</h2>
          <p className="text-muted-foreground mb-8">
            This is a demonstration of advanced animations that can be integrated into the cloud storage application.
            The animation below shows a fluid upload process with interactive elements.
          </p>
          <UploadCard />
        </div>
      </div>
    </>
  );
}