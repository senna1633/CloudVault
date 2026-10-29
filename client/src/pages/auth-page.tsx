import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Cloud, Lock, User, UserPlus, LogIn, Loader2, ShieldCheck, HardDrive } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { insertUserSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Redirect logic
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({
      username: values.username,
      password: values.password,
    });
  };

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          animate={shouldReduceMotion ? undefined : {
            x: [0, 100, 25, -50, 0],
            y: [0, 60, 130, 45, 0],
            scale: [1, 1.22, 0.92, 1.12, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl"
          animate={shouldReduceMotion ? undefined : {
            x: [0, -90, -35, 70, 0],
            y: [0, -110, -30, -85, 0],
            scale: [1, 0.88, 1.15, 0.96, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[38%] top-[42%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
          animate={shouldReduceMotion ? undefined : {
            x: [0, 120, -40, 0],
            y: [0, -90, 70, 0],
            opacity: [0.35, 0.8, 0.5, 0.35],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-36 top-[8%] h-[34rem] w-[34rem] rounded-full border border-primary/10"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.08, 1] }}
          transition={{ rotate: { duration: 48, repeat: Infinity, ease: "linear" }, scale: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
        />
        <motion.div
          className="absolute -right-16 top-[17%] h-[22rem] w-[22rem] rounded-full border border-accent/15"
          animate={shouldReduceMotion ? undefined : { rotate: -360, scale: [1, 0.94, 1] }}
          transition={{ rotate: { duration: 32, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        />
        {!shouldReduceMotion && Array.from({ length: 18 }, (_, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-primary/70 shadow-[0_0_14px_hsl(var(--primary)/0.9)]"
            style={{
              left: `${(index * 47 + 7) % 100}%`,
              top: `${(index * 31 + 13) % 100}%`,
            }}
            animate={{
              opacity: [0.12, 0.9, 0.18],
              scale: [0.6, index % 3 === 0 ? 1.8 : 1.2, 0.6],
              y: [0, index % 2 === 0 ? -18 : 18, 0],
            }}
            transition={{
              duration: 2.4 + (index % 5) * 0.65,
              delay: (index % 7) * 0.22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {!shouldReduceMotion && Array.from({ length: 5 }, (_, index) => (
          <motion.span
            key={`streak-${index}`}
            className="absolute h-px w-48 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            style={{ top: `${18 + index * 16}%`, left: "-12rem" }}
            animate={{ x: ["0vw", "125vw"], opacity: [0, 0.8, 0] }}
            transition={{
              duration: 3.8 + index * 0.7,
              delay: index * 1.35,
              repeat: Infinity,
              repeatDelay: 2.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1920px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-h-dvh flex-col justify-center px-4 py-[clamp(1rem,4vh,3rem)] sm:px-8 lg:px-8 xl:px-12 2xl:px-16 [@media(max-height:700px)]:min-h-0 [@media(max-height:700px)]:justify-center [@media(max-height:700px)]:py-3">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -24, scale: 0.92, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 120, damping: 16, delay: shouldReduceMotion ? 0 : 0.08 }}
            className="mx-auto mb-4 flex w-full max-w-md items-center gap-3 sm:mb-6 [@media(max-height:700px)]:mb-2"
          >
            <motion.div
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_30px_hsl(var(--primary)/0.22)]"
              animate={shouldReduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Cloud className="h-6 w-6" aria-hidden="true" />
            </motion.div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">CloudVault</h1>
              <p className="text-xs text-muted-foreground">Your files, safely at home</p>
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 34, scale: 0.94, rotateX: 8, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 95, damping: 18, delay: shouldReduceMotion ? 0 : 0.18 }}
            whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.008, boxShadow: "0 30px 100px -38px hsl(var(--primary)/0.35)" }}
            className="mx-auto w-full max-w-lg rounded-2xl border border-border/70 bg-card/90 p-5 shadow-2xl shadow-background/50 backdrop-blur sm:p-7 xl:p-9 [@media(max-height:700px)]:p-4"
          >
            <div className="mb-4 sm:mb-6 [@media(max-height:700px)]:mb-2">
              <p className="mb-2 text-sm font-medium text-primary">PRIVATE BY DESIGN</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {activeTab === "login" ? "Welcome back" : "Create your vault"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {activeTab === "login"
                  ? "Sign in to pick up right where you left off."
                  : "Set up an account to keep your files close and secure."}
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="mb-4 grid h-11 w-full grid-cols-2 rounded-lg bg-muted/70 p-1 sm:mb-5 [@media(max-height:700px)]:mb-2">
                <TabsTrigger value="login" className="rounded-md transition-colors duration-200 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-md transition-colors duration-200 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  Create account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <motion.div
                  key="login-form"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 19 }}
                >
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-5 [@media(max-height:700px)]:space-y-2">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                              <Input className="h-11 rounded-lg border-border/80 bg-background/70 pl-10 placeholder:text-muted-foreground/70 transition-shadow duration-300 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_24px_hsl(var(--primary)/0.16)] [@media(max-height:700px)]:h-10" placeholder="Enter your username" autoComplete="username" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                              <Input className="h-11 rounded-lg border-border/80 bg-background/70 pl-10 placeholder:text-muted-foreground/70 transition-shadow duration-300 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_24px_hsl(var(--primary)/0.16)] [@media(max-height:700px)]:h-10" type="password" placeholder="Enter your password" autoComplete="current-password" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.025 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.975 }}>
                    <Button type="submit" className="h-11 w-full rounded-lg font-medium shadow-md shadow-primary/10 transition-[box-shadow,background-color] duration-300 hover:shadow-[0_0_32px_hsl(var(--primary)/0.34)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 [@media(max-height:700px)]:h-10" disabled={loginMutation.isPending}>
                      {loginMutation.isPending
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        : <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {loginMutation.isPending ? "Signing in…" : "Sign in"}
                    </Button>
                    </motion.div>
                  </form>
                </Form>
                </motion.div>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <motion.div
                  key="register-form"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 19 }}
                >
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3 sm:space-y-4 [@media(max-height:700px)]:space-y-1.5">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                              <Input className="h-11 rounded-lg border-border/80 bg-background/70 pl-10 placeholder:text-muted-foreground/70 transition-shadow duration-300 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_24px_hsl(var(--primary)/0.16)] [@media(max-height:700px)]:h-10" placeholder="Choose a username" autoComplete="username" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                              <Input className="h-11 rounded-lg border-border/80 bg-background/70 pl-10 placeholder:text-muted-foreground/70 transition-shadow duration-300 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_24px_hsl(var(--primary)/0.16)] [@media(max-height:700px)]:h-10" type="password" placeholder="Create a strong password" autoComplete="new-password" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                              <Input className="h-11 rounded-lg border-border/80 bg-background/70 pl-10 placeholder:text-muted-foreground/70 transition-shadow duration-300 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_24px_hsl(var(--primary)/0.16)] [@media(max-height:700px)]:h-10" type="password" placeholder="Enter your password again" autoComplete="new-password" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.025 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.975 }}>
                    <Button type="submit" className="h-11 w-full rounded-lg font-medium shadow-md shadow-primary/10 transition-[box-shadow,background-color] duration-300 hover:shadow-[0_0_32px_hsl(var(--primary)/0.34)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 [@media(max-height:700px)]:h-10" disabled={registerMutation.isPending}>
                      {registerMutation.isPending
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        : <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {registerMutation.isPending ? "Creating account…" : "Create account"}
                    </Button>
                    </motion.div>
                  </form>
                </Form>
                </motion.div>
              </TabsContent>
            </Tabs>

            <div className="mt-5 flex items-center justify-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:pt-2">
              <motion.span
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              </motion.span>
              <span>Your account and files stay on your own server.</span>
            </div>
          </motion.div>
        </section>

        <aside className="relative hidden min-h-dvh overflow-hidden border-l border-border/60 bg-card/40 p-8 lg:flex lg:flex-col lg:justify-center lg:p-9 xl:p-12 2xl:p-16 [@media(max-height:700px)]:min-h-0 [@media(max-height:700px)]:py-4">
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <motion.div
            aria-hidden="true"
            className="absolute right-[-8rem] top-[-7rem] h-[28rem] w-[28rem] rounded-full border border-primary/20"
            animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.12, 1], opacity: [0.35, 0.8, 0.35] }}
            transition={{ rotate: { duration: 26, repeat: Infinity, ease: "linear" }, scale: { duration: 5.5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute right-[-3rem] top-[-2rem] h-[18rem] w-[18rem] rounded-full border border-accent/20"
            animate={shouldReduceMotion ? undefined : { rotate: -360, scale: [1, 0.9, 1] }}
            transition={{ rotate: { duration: 19, repeat: Infinity, ease: "linear" }, scale: { duration: 4.2, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 28, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 90, damping: 17, delay: shouldReduceMotion ? 0 : 0.3 }}
            className="relative z-10 mx-auto w-full max-w-xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary [@media(max-height:700px)]:mb-3">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              YOUR PERSONAL CLOUD
            </div>
            <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              A quieter place for everything you keep.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground xl:text-lg">
              Store, share, and access your files from anywhere with a secure cloud that stays under your control.
            </p>

            <div className="mt-8 space-y-3 [@media(max-height:700px)]:mt-4">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { x: 8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 17 }}
                className="flex gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_0_26px_hsl(var(--primary)/0.12)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-medium">Private by default</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">Your files stay on your server, without external storage dependencies.</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { x: 8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 17 }}
                className="flex gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-[border-color,box-shadow] duration-300 hover:border-accent/40 hover:shadow-[0_0_26px_hsl(var(--accent)/0.12)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HardDrive className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-medium">Room for what matters</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">Keep your important files together in one personal vault.</p>
                </div>
              </motion.div>
            </div>
            <div className="mt-9 flex items-center gap-3 text-sm text-muted-foreground [@media(max-height:700px)]:mt-4">
              <motion.span
                animate={shouldReduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 7, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Cloud className="h-5 w-5 text-primary" aria-hidden="true" />
              </motion.span>
              <span>CloudVault <span className="mx-1.5 text-border">·</span> A space that’s yours</span>
            </div>
          </motion.div>
        </aside>
      </div>
    </main>
  );
}