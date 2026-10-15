// src/components/admin/pos/POSLayout.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { POSCart } from "./POSCart";
import { POSProductGrid } from "./POSProductGrid";
import { POSProductSearch } from "./POSProductSearch";
import { POSCheckoutDialog } from "./POSCheckoutDialog";
import { POSReceipt } from "./POSReceipt";
import { useBarcodeScanner } from "@/lib/admin/pos/use-barcode-scanner";
import { computeTotals, usePOSCart } from "@/lib/admin/pos/cart-store";
import { useCreateOrder, useProducts, useSettings } from "@/hooks/admin";
import { productsApi } from "@/lib/admin/api";
import { toast } from "sonner";
import type { ProductResponse } from "@/lib/validations/product.schema";
import type { OrderResponse } from "@/lib/validations/order.schema";
import type { PaymentMethod } from "@/lib/admin/api";

/* ============================================================
 * Debounce helper
 * ============================================================ */

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/* ============================================================
 * Component
 * ============================================================ */

export function POSLayout() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);

  const lines = usePOSCart((s) => s.lines);
  const customer = usePOSCart((s) => s.customer);
  const channel = usePOSCart((s) => s.channel);
  const notes = usePOSCart((s) => s.notes);
  const addLine = usePOSCart((s) => s.addLine);
  const clear = usePOSCart((s) => s.clear);

  const totals = useMemo(() => computeTotals(lines), [lines]);

  /* ----------------------------------------------------------
   * Product list
   * ---------------------------------------------------------- */

  const productsQuery = useProducts({
    q: debouncedSearch.trim() || undefined,
    isActive: true,
    limit: 40,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const products = productsQuery.data?.items ?? [];

  const settingsQuery = useSettings();
  const createOrderMutation = useCreateOrder();

  /* ----------------------------------------------------------
   * Add product to cart
   * ---------------------------------------------------------- */

  const addProductToCart = useCallback(
    (product: ProductResponse) => {
      if (product.stock <= 0) {
        toast.error(`${product.name.en} is out of stock`);
        return;
      }

      addLine({
        productId: product._id,
        name: product.name.en,
        sku: product.sku ?? "",
        imageUrl: product.images?.[0]?.url,
        unitPrice: product.price,
        costPrice: product.costPrice ?? 0,
        stockAvailable: product.stock,
        quantity: 1,
      });
    },
    [addLine],
  );

  /* ----------------------------------------------------------
   * Barcode scanner
   * ---------------------------------------------------------- */

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const local = products.find(
          (p) => p.barcode === barcode || p.sku === barcode,
        );
        if (local) {
          addProductToCart(local);
          setSearch("");
          return;
        }

        const result = await productsApi.list({
          q: barcode,
          isActive: true,
          limit: 1,
        });
        const match = result.items[0];
        if (match) {
          addProductToCart(match);
          setSearch("");
        } else {
          toast.error(`No product found for "${barcode}"`);
        }
      } catch {
        toast.error("Barcode lookup failed");
      }
    },
    [products, addProductToCart],
  );

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !checkoutOpen && lastOrder === null,
  });

  /* ----------------------------------------------------------
   * Checkout
   * ---------------------------------------------------------- */

  const handleConfirmSale = async (input: {
    paymentMethod: PaymentMethod;
    tenderAmount: number;
  }) => {
    const items = lines.map((l) => ({
      product: l.productId,
      quantity: l.quantity,
      priceAtTime: l.unitPrice,
      costPriceAtTime: l.costPrice,
      discount: l.discount,
    }));

    const hasCustomerInfo =
      customer.customerId || customer.name?.trim() || customer.phone?.trim();

    const order = await createOrderMutation.mutateAsync({
      channel,
      customer: hasCustomerInfo
        ? {
            id: customer.customerId,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          }
        : undefined,
      items,
      shippingFee: 0,
      status: "delivered",
      paymentStatus: "paid",
      paymentMethod: input.paymentMethod,
      notes: notes.trim() || undefined,
    });

    setLastOrder(order);
    clear();
  };

  const handleNewSale = () => {
    setLastOrder(null);
    setCheckoutOpen(false);
    setSearch("");
  };

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className="space-y-4">
      <PageHeader
        title="New sale"
        description="Point of sale — add products, take payment, print receipt."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: "POS" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          <POSProductSearch value={search} onChange={setSearch} />

          {productsQuery.isLoading && products.length === 0 ? (
            <div className="grid place-items-center rounded-lg border border-dashed border-brand-border px-6 py-16">
              <Loader2
                className="h-5 w-5 animate-spin text-brand-text-secondary"
                aria-hidden="true"
              />
            </div>
          ) : (
            <POSProductGrid
              products={products}
              isLoading={productsQuery.isFetching}
              onAdd={addProductToCart}
            />
          )}
        </div>

        <div className="lg:h-[calc(100vh-180px)] lg:sticky lg:top-4">
          <POSCart
            onCheckout={() => setCheckoutOpen(true)}
            className="h-full"
          />
        </div>
      </div>

      <POSCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        lines={lines}
        totals={totals}
        onConfirm={handleConfirmSale}
      />

      <POSReceipt
        order={lastOrder}
        open={lastOrder !== null}
        onOpenChange={(open) => {
          if (!open) setLastOrder(null);
        }}
        onNewSale={handleNewSale}
        storeName={settingsQuery.data?.store.name ?? "Dorkari Jinish BD"}
        storePhone={settingsQuery.data?.store.phone}
        storeAddress={settingsQuery.data?.store.address}
      />
    </div>
  );
}

export default POSLayout;
