import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
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
import { useAuth } from "@/hooks/use-auth";

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
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
  const { user } = useAuth();
  const { showNewFolderModal, setShowNewFolderModal } = useFileContext();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState("#0A84FF");
  
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
        userId: user?.id, // Include userId from authenticated user
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
  
  const onSubmit = (data: FolderFormValues) => {
    data.color = selectedColor;
    createFolderMutation.mutate(data);
  };
  
  return (
    <Dialog open={showNewFolderModal} onOpenChange={setShowNewFolderModal}>
      <DialogContent className="bg-secondary sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Create New Folder</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Folder Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter folder name" 
                      className="bg-muted text-foreground"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel className="text-sm text-muted-foreground">Folder Color</FormLabel>
              <div className="flex space-x-2">
                {folderColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full ${
                      selectedColor === color.value ? 'ring-2 ring-foreground' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewFolderModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-accent hover:bg-accent/90"
                disabled={createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
