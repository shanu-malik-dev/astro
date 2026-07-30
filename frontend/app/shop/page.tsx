"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { DisabledRouteRedirect } from "@/components/DisabledRouteRedirect";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { Section } from "@/components/ui/Section";
import { SiteSnackbar } from "@/components/ui/SiteSnackbar";
import { ApiError, productApi, type ProductDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useTenant } from "@/lib/tenant-context";
import { WEBSITE_MODULE_FLAGS } from "@/lib/visibility-flags";

function getLocalizedProduct(product: ProductDto, language: string) {
  const translation = product.all_names?.find(
    (item) => item.label.toLowerCase() === language
  );

  return {
    name:
      translation?.value ||
      (language === "hi" ? product.hi_label : product.name) ||
      product.name,
    description: translation?.description || product.description || "",
  };
}

export default function ShopPage() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-products", tenant.id],
    queryFn: () => productApi.publicList(tenant.id),
  });
  const products = useMemo(() => data?.data || [], [data?.data]);

  useEffect(() => {
    if (!isError) return;
    setSnackbar(
      error instanceof ApiError ? error.message : "Unable to load products."
    );
  }, [error, isError]);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  if (!WEBSITE_MODULE_FLAGS.shop) return <DisabledRouteRedirect />;

  const purchaseProduct = async (product: ProductDto) => {
    setSnackbar("");
    setPurchaseId(product.id);

    try {
      const response = await productApi.purchase(tenant.id, {
        product_id: product.id,
        customer_name: user?.fullName || user?.name,
        country_code: user?.country_code || "+91",
        mobile: user?.mobile || undefined,
      });
      const paymentLink = response.data?.payment_link;
      if (!paymentLink) throw new Error("Payment link unavailable.");

      window.location.href = paymentLink;
    } catch (err) {
      setSnackbar(
        err instanceof ApiError
          ? err.message
          : "Unable to open Razorpay checkout."
      );
      setPurchaseId(null);
    }
  };

  return (
    <>
      <Section tone="dark" className="!py-6 md:!py-8">
        <p className="eyebrow-on-dark">Shop</p>
        <h1 className="mt-3 max-w-2xl text-3xl leading-tight md:text-4xl">
          Religious products for your daily pooja and remedies.
        </h1>
      </Section>

      <Section className="!py-10 md:!py-14">
        {isLoading && <FullPageLoader message={t("common.actions.pleaseWait")} />}
        <SiteSnackbar message={snackbar} onClose={() => setSnackbar("")} />

        {!isLoading && !isError && products.length === 0 && (
          <div className="rounded-lg border border-mist bg-white px-4 py-8 text-center text-sm text-ink/60">
            Products will be available shortly.
          </div>
        )}

        {products.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const localized = getLocalizedProduct(product, language);
              const purchasing = purchaseId === product.id;

              return (
                <div
                  key={product.id}
                  className="flex overflow-hidden rounded-lg border border-mist bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex w-full flex-col">
                    <div className="flex h-64 items-center justify-center bg-white p-4">
                      <img
                        src={product.product_image}
                        alt={localized.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs uppercase tracking-[0.14em] text-gold-dark">
                        {product.product_code}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold leading-snug text-ink">
                        {localized.name}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/60">
                        {localized.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                        <p className="font-display text-2xl text-ink">
                          ₹{Number(product.product_price || 0).toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => purchaseProduct(product)}
                          disabled={Boolean(purchaseId)}
                          className="inline-flex items-center gap-2 rounded-md bg-wine px-4 py-2.5 text-sm font-medium text-white transition hover:bg-wine/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShoppingBag size={16} />
                          {purchasing ? "Opening..." : "Purchase"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
