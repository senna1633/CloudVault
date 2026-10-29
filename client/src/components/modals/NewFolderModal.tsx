import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const folderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required"),
  color: z.string().default("#0A84FF"),
});

type FolderFormValues = z.infer<typeof folderSchema>;

const folderColors = [
  { name: "Blue", value: "#0A84FF" },
  { name: "Green", value: "#34C759" },
  { name: "Orange", value: "#FF9500" },
  { name: "Red", value: "#FF3B30" },
  { name: "Purple", value: "#9c27b0" },
  { name: "Pink", value: "#e91e63" },
];

export function NewFolderModal() {
  const params = useParams();
  const { showNewFolderModal, setShowNewFolderModal } = useFileContext();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      color: "#0A84FF",
    },
  });
  
  const createFolderMutation = useMutation({
    mutationFn: async (data: FolderFormValues) => {
      return apiRequest("POST", "/api/folders", {
        ...data,
        parentId: params.folderId ? Number(params.folderId) : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Folder Created",
        description: "Your folder has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setShowNewFolderModal(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const selectedColor = form.watch("color");
  const onSubmit = (data: FolderFormValues) => createFolderMutation.mutate(data);
  
  return (
    <Dialog
      open={showNewFolderModal}
      onOpenChange={(open) => {
        if (createFolderMutation.isPending) return;
        setShowNewFolderModal(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto border-border bg-card text-card-foreground shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your files. Choose a name and color for your folder.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" aria-busy={createFolderMutation.isPending}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Folder Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter folder name" 
                      className="bg-background text-foreground placeholder:text-muted-foreground"
                      autoComplete="off"
                      disabled={createFolderMutation.isPending}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel className="text-sm text-muted-foreground">Folder Color</FormLabel>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Folder color">
                {folderColors.map((color) => (
                  <motion.button
                    key={color.value}
                    type="button"
                    className={`h-9 w-9 rounded-full border border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                      selectedColor === color.value ? 'ring-2 ring-foreground ring-offset-2' : ''
                    }`}
                    whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                    transition={{ duration: reduceMotion ? 0 : 0.14 }}
                    style={{ backgroundColor: color.value }}
                    onClick={() => form.setValue("color", color.value, { shouldDirty: true })}
                    aria-label={`Select ${color.name} color`}
                    aria-pressed={selectedColor === color.value}
                    title={color.name}
                    disabled={createFolderMutation.isPending}
                  />
                ))}
              </div>
            </div>
            
            <DialogFooter className="gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewFolderModal(false)}
                disabled={createFolderMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? "Creating folder…" : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
