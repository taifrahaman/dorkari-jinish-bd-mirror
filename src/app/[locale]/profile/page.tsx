// src/app/[locale]/profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LogOut,
  Package,
  User as UserIcon,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/useAuthStore";
import type { Locale } from "@/lib/shop/types";

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Must be a valid BD number (e.g., 01712345678)"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  params.then((p) => setLocale(p.locale as Locale));

  const router = useRouter();
  const { user, isLoading, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"details" | "addresses">(
    "details",
  );

  // --- Personal Info Editing State ---
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  // Sync form with user data
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user, reset]);

  // --- Address State ---
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    address: "",
    phone: "",
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push(`/${locale}/login`);
  }, [user, isLoading, router, locale]);

  if (isLoading || !user) return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    toast.success(locale === "bn" ? "লগআউট হয়েছে" : "Logged out");
    router.push(`/${locale}`);
  };

  // Save Name, Phone, Email
  const onSubmitInfo = async (data: ProfileForm) => {
    setIsSavingInfo(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setUser(json.user);
      setIsEditingInfo(false);
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Save Address
  const onSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    try {
      const updatedAddresses = [...(user.addresses || []), newAddress];
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setUser(json.user);
      setIsAddingAddress(false);
      setNewAddress({
        label: "Home",
        address: "",
        phone: "",
        isDefault: false,
      });
      toast.success("Address saved");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save address",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id?: string) => {
    if (!id) return;
    const updatedAddresses = user.addresses?.filter((a) => a._id !== id) || [];
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });
      const json = await res.json();
      if (json.success) {
        setUser(json.user);
        toast.success("Address removed");
      }
    } catch {
      toast.error("Failed to remove address");
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <h1 className="mb-8 font-heading text-3xl font-bold text-brand-text">
        {locale === "bn" ? "আমার প্রোফাইল" : "My Account"}
      </h1>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-none space-y-1">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "details"
                ? "bg-brand-primary text-white"
                : "text-brand-text hover:bg-brand-navbar"
            }`}
          >
            <UserIcon className="h-4 w-4" /> Account Details
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "addresses"
                ? "bg-brand-primary text-white"
                : "text-brand-text hover:bg-brand-navbar"
            }`}
          >
            <MapPin className="h-4 w-4" /> Address Book
          </button>
          <Link
            href={`/${locale}/profile/orders`}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-text transition-colors hover:bg-brand-navbar"
          >
            <Package className="h-4 w-4" /> My Orders
          </Link>
          <Link
            href={`/${locale}/wishlist`}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-text transition-colors hover:bg-brand-navbar"
          >
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
          <div className="my-2 border-t border-brand-border" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-3xl border border-brand-border bg-brand-surface p-6 sm:p-8">
          {/* --- TAB 1: PERSONAL DETAILS --- */}
          {activeTab === "details" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-text">
                  Personal Information
                </h2>
                {!isEditingInfo && (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="flex items-center gap-1.5 rounded-full bg-brand-navbar px-4 py-2 text-xs font-semibold text-brand-text hover:bg-brand-border"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
              </div>

              {isEditingInfo ? (
                <form
                  onSubmit={handleSubmit(onSubmitInfo)}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-brand-text">
                      Full Name
                    </label>
                    <input
                      {...register("name")}
                      className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-brand-text">
                      Phone Number
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-brand-text">
                      Email (Optional)
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingInfo}
                      className="flex items-center gap-1.5 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isSavingInfo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}{" "}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingInfo(false);
                        reset();
                      }}
                      disabled={isSavingInfo}
                      className="flex items-center gap-1.5 rounded-full border border-brand-border px-5 py-2 text-sm font-semibold text-brand-text"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Full Name
                    </p>
                    <p className="mt-1 font-medium text-brand-text">
                      {user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Phone Number
                    </p>
                    <p className="mt-1 font-medium text-brand-text">
                      {user.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Email Address
                    </p>
                    <p className="mt-1 font-medium text-brand-text">
                      {user.email || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB 2: ADDRESSES --- */}
          {activeTab === "addresses" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-text">
                  Saved Addresses
                </h2>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" /> Add New
                  </button>
                )}
              </div>

              {/* Address List */}
              <div className="space-y-4">
                {user.addresses?.length === 0 && (
                  <p className="text-sm text-brand-text-secondary">
                    No addresses saved yet.
                  </p>
                )}
                {user.addresses?.map((addr) => (
                  <div
                    key={addr._id}
                    className="relative rounded-2xl border border-brand-border p-4 bg-brand-surface"
                  >
                    {addr.isDefault && (
                      <span className="absolute right-4 top-4 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-primary">
                        Default
                      </span>
                    )}
                    <p className="font-semibold text-brand-text">
                      {addr.label}
                    </p>
                    <p className="mt-1 text-sm text-brand-text-secondary">
                      {addr.address}
                    </p>
                    <p className="mt-1 text-sm text-brand-text-secondary">
                      Phone: {addr.phone}
                    </p>
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Address Form */}
              {isAddingAddress && (
                <form
                  onSubmit={onSubmitAddress}
                  className="mt-6 rounded-2xl border border-brand-border bg-brand-navbar/30 p-4"
                >
                  <h3 className="mb-4 font-semibold text-brand-text">
                    Add New Address
                  </h3>
                  <div className="space-y-3">
                    <input
                      placeholder="Label (e.g. Home, Office)"
                      value={newAddress.label}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, label: e.target.value })
                      }
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm"
                      required
                    />
                    <textarea
                      placeholder="Full Address"
                      value={newAddress.address}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          address: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm"
                      rows={2}
                      required
                    />
                    <input
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm"
                      required
                    />
                    <label className="flex items-center gap-2 text-sm text-brand-text">
                      <input
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            isDefault: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                      />
                      Set as default address
                    </label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isSavingAddress ? "Saving..." : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="rounded-full border border-brand-border px-5 py-2 text-sm font-semibold text-brand-text"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
