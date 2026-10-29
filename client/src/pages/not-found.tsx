import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.main
      className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
    >
      <motion.div
        className="w-full max-w-lg"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.32, delay: shouldReduceMotion ? 0 : 0.04, ease: "easeOut" }}
      >
      <Card className="w-full overflow-hidden rounded-3xl border-border bg-card shadow-xl shadow-background/30">
        <div className="h-1 w-full bg-primary/70" aria-hidden="true" />
        <CardContent className="px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Error 404</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Page not found</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            The page you’re looking for doesn’t exist or may have moved.
          </p>
          <Button asChild className="mt-7">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Return to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
      </motion.div>
    </motion.main>
  );
}
