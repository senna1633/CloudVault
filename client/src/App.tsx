import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Files from "@/pages/files";
import AnimationsPage from "@/pages/animations";
import AuthPage from "@/pages/auth-page";
import AppShell from "@/components/layout/AppShell";
import { FilePreviewModal } from "./components/modals/FilePreviewModal";
import { NewFolderModal } from "./components/modals/NewFolderModal";
import { UploadProgressModal } from "./components/modals/UploadProgressModal";
import { FileProvider } from "./contexts/FileContext";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => (
        <AppShell>
          <Home />
        </AppShell>
      )} />
      <ProtectedRoute path="/files" component={() => (
        <AppShell>
          <Files />
        </AppShell>
      )} />
      <ProtectedRoute path="/files/:folderId" component={(params: { folderId: string }) => (
        <AppShell>
          <Files />
        </AppShell>
      )} />
      <ProtectedRoute path="/animations" component={() => (
        <AppShell>
          <AnimationsPage />
        </AppShell>
      )} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FileProvider>
          <Router />
          <FilePreviewModal />
          <NewFolderModal />
          <UploadProgressModal />
          <Toaster />
        </FileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
