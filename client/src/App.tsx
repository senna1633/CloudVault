import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Files from "@/pages/files";
import AppShell from "@/components/layout/AppShell";
import { FilePreviewModal } from "./components/modals/FilePreviewModal";
import { NewFolderModal } from "./components/modals/NewFolderModal";
import { UploadProgressModal } from "./components/modals/UploadProgressModal";
import { FileProvider } from "./contexts/FileContext";

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/files" component={Files} />
        <Route path="/files/:folderId" component={Files} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileProvider>
        <Router />
        <FilePreviewModal />
        <NewFolderModal />
        <UploadProgressModal />
        <Toaster />
      </FileProvider>
    </QueryClientProvider>
  );
}

export default App;
