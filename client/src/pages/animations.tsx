import { motion, useReducedMotion } from "framer-motion";
import Header from "@/components/layout/Header";
import UploadCard from "@/components/animations/UploadCard";

export default function AnimationsPage() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <>
      <Header title="Animations Demo" />
      <motion.main
        className="w-full flex-1 overflow-auto px-4 py-6 sm:px-7 lg:px-10"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="mb-8"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.04 }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Motion preview</p>
            <h1 className="text-3xl font-semibold tracking-tight">Upload animation</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This is a demonstration of advanced animations that can be integrated into the cloud storage application.
              The animation below shows a fluid upload process with interactive elements.
            </p>
          </motion.div>
          <motion.section
            aria-label="Upload animation preview"
            className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.08 }}
          >
            <UploadCard />
          </motion.section>
        </div>
      </motion.main>
    </>
  );
}