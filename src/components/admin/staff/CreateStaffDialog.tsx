// src/components/admin/staff/CreateStaffDialog.tsx

"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateStaff } from "@/hooks/admin";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Securely generate a strong password
function generateStrongPassword(length = 14) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  return password;
}

export function CreateStaffDialog({ open, onOpenChange }: Props) {
  const createMutation = useCreateStaff();
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    canCreateProduct: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      // Save the plaintext password to show the admin before closing
      setSuccessData({ email: formData.email, password: formData.password });
    } catch {
      // Error is handled by the hook's toast
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setSuccessData(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        canCreateProduct: false,
      });
      setCopied(false);
    }, 300);
  };

  const copyToClipboard = () => {
    if (!successData) return;
    const text = `Welcome to Dorkari Admin!\n\nYour Moderator Account:\nEmail: ${successData.email}\nPassword: ${successData.password}\n\nLogin here: ${window.location.origin}/admin/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGeneratePassword = () => {
    setFormData((s) => ({ ...s, password: generateStrongPassword() }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Create a new moderator account. They will be able to log in to the
            admin panel.
          </DialogDescription>
        </DialogHeader>

        {successData ? (
          <div className="space-y-4 pt-4">
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-emerald-900">
                Account Created!
              </h3>
              <p className="text-sm text-emerald-700 mt-1">
                Please copy the credentials below and send them to the moderator
                securely.
              </p>
            </div>

            <div className="rounded-md border border-brand-border bg-muted/30 p-3 text-sm space-y-1 font-mono">
              <p>
                <span className="text-brand-text-secondary">Email:</span>{" "}
                {successData.email}
              </p>
              <p>
                <span className="text-brand-text-secondary">Password:</span>{" "}
                {successData.password}
              </p>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={copyToClipboard} className="gap-2">
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, email: e.target.value }))
                }
                placeholder="moderator@dorkari.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, password: e.target.value }))
                  }
                  placeholder="Min 8 characters"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  className="shrink-0"
                  title="Generate strong password"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-brand-border p-3 mt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Product Creation</Label>
                <p className="text-xs text-brand-text-secondary">
                  Allow this moderator to create and edit products.
                </p>
              </div>
              <Switch
                checked={formData.canCreateProduct}
                onCheckedChange={(v) =>
                  setFormData((s) => ({ ...s, canCreateProduct: v }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
