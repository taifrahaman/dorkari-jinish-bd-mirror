// src/components/admin/staff/StaffList.tsx

"use client";

import { useState } from "react";
import { Plus, UserCog, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import {
  useStaff,
  useUpdateStaff,
  useDeleteStaff,
  usePermanentDeleteStaff,
  useReactivateStaff,
  type StaffMember,
} from "@/hooks/admin";
import { CreateStaffDialog } from "./CreateStaffDialog";

export function StaffList() {
  const { data: staff = [], isLoading } = useStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();
  const permanentDeleteMutation = usePermanentDeleteStaff();
  const reactivateMutation = useReactivateStaff();

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"active" | "deactivated">("active");

  const activeStaff = staff.filter((s) => !s.deletedAt);
  const deactivatedStaff = staff.filter((s) => s.deletedAt);
  const displayStaff = filter === "active" ? activeStaff : deactivatedStaff;

  const handleDeactivate = (id: string) => {
    if (
      confirm(
        "Are you sure you want to deactivate this staff member? They will no longer be able to log in.",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handlePermanentDelete = (id: string, name: string) => {
    const confirmMsg = `Are you absolutely sure you want to PERMANENTLY delete ${name}?\n\nThis action CANNOT be undone. If this moderator created any orders or products, those records will lose their associated staff name.`;
    if (confirm(confirmMsg)) {
      permanentDeleteMutation.mutate(id);
    }
  };

  const handleToggleCanCreate = (id: string, current: boolean) => {
    updateMutation.mutate({ id, canCreateProduct: !current });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Manage admin and moderator accounts."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Staff" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Moderator
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brand-border">
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "active"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-text-secondary hover:text-brand-primary"
          }`}
        >
          Active Staff ({activeStaff.length})
        </button>
        <button
          onClick={() => setFilter("deactivated")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "deactivated"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-text-secondary hover:text-brand-primary"
          }`}
        >
          Deactivated ({deactivatedStaff.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-brand-text-secondary">
          Loading staff...
        </div>
      ) : displayStaff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={
            filter === "active" ? "No active staff" : "No deactivated staff"
          }
          description={
            filter === "active"
              ? "Add a moderator to help manage your store."
              : "Any staff you deactivate will appear here."
          }
        />
      ) : (
        <div className="rounded-md border border-brand-border bg-brand-surface overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-brand-border text-brand-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Product Creation</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {displayStaff.map((member: StaffMember) => (
                <tr key={member._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-brand-text">
                    {member.name}
                    {member.deletedAt && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] text-destructive border-destructive/30"
                      >
                        Deactivated
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary">
                    {member.email}
                  </td>
                  <td className="px-4 py-3">
                    {member.role === "admin" ? (
                      <Badge className="bg-brand-primary text-white hover:bg-brand-primary">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-brand-border">
                        Moderator
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {member.role === "admin" ? (
                      <span className="text-xs text-brand-text-secondary flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />{" "}
                        Full Access
                      </span>
                    ) : (
                      <Switch
                        checked={member.canCreateProduct}
                        onCheckedChange={() =>
                          handleToggleCanCreate(
                            member._id,
                            member.canCreateProduct,
                          )
                        }
                        disabled={
                          updateMutation.isPending || !!member.deletedAt
                        }
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.role !== "admin" && (
                      <>
                        {!member.deletedAt ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeactivate(member._id)}
                            disabled={deleteMutation.isPending}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                reactivateMutation.mutate(member._id)
                              }
                              disabled={reactivateMutation.isPending}
                            >
                              Reactivate
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handlePermanentDelete(member._id, member.name)
                              }
                              disabled={permanentDeleteMutation.isPending}
                            >
                              Delete Forever
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateStaffDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
