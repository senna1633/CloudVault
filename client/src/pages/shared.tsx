import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Header from "@/components/layout/Header";
import { Share2, UsersRound } from "lucide-react";

const SharedPage = () => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <>
      <Header title="Shared" />
      <motion.main
        className="w-full flex-1 overflow-auto px-4 py-6 sm:px-7 lg:px-10"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-[1600px]">
          <motion.div
            className="mb-7"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.04 }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your library</p>
            <h1 className="text-3xl font-semibold tracking-tight">Shared with me</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Files and folders other people have shared with you.
            </p>
          </motion.div>
          <motion.section
            aria-labelledby="shared-empty-heading"
            className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center sm:min-h-[50vh]"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18, delay: 0.08 }}
          >
            <motion.div
              className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-primary/20 bg-primary/10 text-primary shadow-[0_0_50px_hsl(var(--primary)/0.12)]"
              animate={shouldReduceMotion ? undefined : { y: [0, -9, 0], rotate: [0, 2, -2, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              {!shouldReduceMotion && (
                <>
                  <motion.span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-[2rem] border border-primary/20"
                    animate={{ rotate: 360, scale: [1, 1.12, 1], opacity: [0.45, 0.9, 0.45] }}
                    transition={{ rotate: { duration: 16, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="absolute -inset-6 rounded-[2.4rem] border border-dashed border-accent/15"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                  />
                </>
              )}
              <motion.span
                animate={shouldReduceMotion ? undefined : { rotate: [0, -7, 7, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <UsersRound className="h-8 w-8" aria-hidden="true" />
              </motion.span>
              <motion.span
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
                animate={shouldReduceMotion ? undefined : { y: [0, 4, 0], rotate: [0, 12, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.span>
            </motion.div>
            <h2 id="shared-empty-heading" className="mb-2 text-xl font-semibold">Nothing shared with you yet</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              When someone shares a file or folder with you, you’ll find it here.
            </p>
          </motion.section>
        </div>
      </motion.main>
    </>
  );
};

export default SharedPage;