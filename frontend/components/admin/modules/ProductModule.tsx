import { useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Loader2, Power, Save, Search, Trash2, X } from "lucide-react";
import { ApiError, productApi, type ProductDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import {
  createEmptyServiceTranslations,
  getEnglishTranslation,
  syncServiceTranslations,
} from "../helpers";
import {
  DateRangeFilter,
  EmptyListState,
  formatAdminDate,
  ListPanelHeader,
  ModuleHeader,
  Pagination,
  StatusBadge,
  toAdminDateRange,
} from "../shared";
import type { DateRangeValue } from "@/components/ui/CustomDatePicker";
import type { ProductRow, ServiceTranslation } from "../types";

type ProductFormErrors = {
  productCode?: string;
  productImage?: string;
  productPrice?: string;
  displayOrder?: string;
  names?: Record<string, string>;
};

function labelToLangCode(label: string) {
  const normalized = label.toLowerCase();
  if (normalized === "hi" || normalized === "hindi") return "hi";
  return "en";
}

function labelToName(label: string) {
  const normalized = label.toLowerCase();
  if (normalized === "hi" || normalized === "hindi") return "Hindi";
  return "English";
}

function syncProductTranslations(product: ProductRow): ProductRow {
  return {
    ...product,
    translations: syncServiceTranslations({
      id: product.id,
      createdAt: product.createdAt,
      displayOrder: product.displayOrder,
      status: product.status,
      translations: product.translations,
    }).translations,
  };
}

function mapProductDto(product: ProductDto): ProductRow {
  const translations =
    product.all_names?.map((item) => ({
      lang: labelToLangCode(item.label),
      label: labelToName(item.label),
      name: item.value || "",
      description: item.description || "",
    })) || [];

  return syncProductTranslations({
    id: Number(product.id),
    createdAt: product.created_at,
    productCode: product.product_code,
    productImage: product.product_image,
    productPrice: Number(product.product_price || 0),
    displayOrder: Number(product.display_order || 1),
    status: Number(product.status) === 1 ? "active" : "inactive",
    translations,
  });
}

function toTranslationPayload(translations: ServiceTranslation[]) {
  return translations
    .filter((translation) => translation.name.trim())
    .map((translation) => ({
      lang_code: translation.lang,
      name: translation.name.trim(),
      description: translation.description.trim(),
    }));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ProductModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [draft, setDraft] = useState<ProductRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [appliedDateFilter, setAppliedDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const lastFetchKeyRef = useRef("");

  const loadProducts = useCallback(
    async (page: number, sortOrder = sortDirection) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);

      try {
        const response = await productApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          sort_order: sortOrder,
          date_from: appliedDateFilter.start || undefined,
          date_to: appliedDateFilter.end || undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setProducts(records.map(mapProductDto));
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load product list."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, appliedDateFilter, snackbar, sortDirection, tenant.id]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "products",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      date: appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadProducts(1);
  }, [accessToken, appliedDateFilter, loadProducts, tenant.id]);

  const applyDateFilter = (range = dateFilter) => {
    setAppliedDateFilter(toAdminDateRange(range));
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    const emptyRange = { start: "", end: "" };
    setDateFilter(emptyRange);
    setAppliedDateFilter(emptyRange);
    setCurrentPage(1);
  };

  const startCreate = () => {
    setFormErrors({});
    setDraft({
      id: 0,
      productCode: "",
      productImage: "",
      productPrice: 1,
      displayOrder: totalRecords + 1,
      status: "active",
      translations: createEmptyServiceTranslations(),
    });
  };

  const validateDraft = (currentDraft: ProductRow) => {
    const errors: ProductFormErrors = {};
    const maxDisplayOrder = currentDraft.id ? totalRecords : totalRecords + 1;

    if (!currentDraft.productCode.trim()) {
      errors.productCode = "Product code is required.";
    }
    if (!currentDraft.productImage.trim()) {
      errors.productImage = "Product image is required.";
    }
    if (!currentDraft.productPrice || currentDraft.productPrice <= 0) {
      errors.productPrice = "Product price must be greater than zero.";
    }
    if (!currentDraft.displayOrder || currentDraft.displayOrder < 1) {
      errors.displayOrder = "Display order is required.";
    } else if (!currentDraft.id && currentDraft.displayOrder !== maxDisplayOrder) {
      errors.displayOrder = `Display order must be ${maxDisplayOrder}.`;
    } else if (currentDraft.id && currentDraft.displayOrder > maxDisplayOrder) {
      errors.displayOrder = `Display order must be between 1 and ${maxDisplayOrder}.`;
    }

    const nameErrors = currentDraft.translations.reduce<Record<string, string>>(
      (current, translation) => {
        if (!translation.name.trim()) {
          current[translation.lang] = `${translation.label} product name is required.`;
        }
        return current;
      },
      {}
    );

    if (Object.keys(nameErrors).length) errors.names = nameErrors;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveDraft = async () => {
    if (!draft || !accessToken) return;
    if (!validateDraft(draft)) return;

    const translations = toTranslationPayload(draft.translations);
    setSaving(true);
    snackbar.setPageLoading(true);

    try {
      if (draft.id) {
        await productApi.update(tenant.id, accessToken, {
          id: draft.id,
          product_code: draft.productCode,
          product_image: draft.productImage,
          product_price: draft.productPrice,
          display_order: draft.displayOrder,
          translations,
        });
        snackbar.success("Product updated successfully.");
      } else {
        await productApi.create(tenant.id, accessToken, {
          product_code: draft.productCode,
          product_image: draft.productImage,
          product_price: draft.productPrice,
          display_order: draft.displayOrder,
          translations,
        });
        snackbar.success("Product created successfully.");
      }

      setDraft(null);
      await loadProducts(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!accessToken) return;
    const confirmed = await snackbar.confirm({
      title: "Delete Product",
      message: "Are you sure you want to delete this product?",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    snackbar.setPageLoading(true);
    try {
      await productApi.remove(tenant.id, accessToken, { id: productId });
      snackbar.success("Product deleted successfully.");
      await loadProducts(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete product."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const toggleStatus = async (product: ProductRow) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await productApi.updateStatus(tenant.id, accessToken, {
        id: product.id,
        status: product.status === "active" ? 0 : 1,
      });
      snackbar.success("Product status updated successfully.");
      await loadProducts(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to update product status."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const uploadProductImage = async (file: File | undefined) => {
    if (!draft || !file) return;

    if (!file.type.startsWith("image/")) {
      setFormErrors((current) => ({
        ...current,
        productImage: "Please upload a valid image file.",
      }));
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setFormErrors((current) => ({
        ...current,
        productImage: "Image size must be 1.5 MB or less.",
      }));
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setFormErrors((current) => ({ ...current, productImage: undefined }));
    setDraft({ ...draft, productImage: dataUrl });
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Products Module"
        createLabel="Create Product"
        onCreate={startCreate}
        onList={() => loadProducts(currentPage)}
        onSort={() => {
          const nextDirection = sortDirection === "asc" ? "desc" : "asc";
          setSortDirection(nextDirection);
          loadProducts(1, nextDirection);
        }}
        sortDirection={sortDirection}
      />

      <div className="admin-filter-panel mt-3">
        <DateRangeFilter
          value={dateFilter}
          onChange={setDateFilter}
          onApply={applyDateFilter}
          onClear={clearDateFilter}
          hasValue={Boolean(appliedDateFilter.start || appliedDateFilter.end)}
        />
        <button
          type="button"
          onClick={() => applyDateFilter()}
          className="admin-create-button"
          title="Search"
          aria-label="Search"
        >
          <Search size={14} />
        </button>
      </div>

      <div data-admin-list className="mt-4 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <ListPanelHeader
          title="Product Listing"
          totalRecords={totalRecords}
          createLabel="Create Product"
          onCreate={startCreate}
          onList={() => loadProducts(currentPage)}
          onSort={() => {
            const nextDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(nextDirection);
            loadProducts(1, nextDirection);
          }}
          sortDirection={sortDirection}
          loading={loading}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-24 px-4 py-2.5 font-semibold">Image</th>
                <th className="w-36 px-4 py-2.5 font-semibold">Code</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Name</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Price</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-40 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-5">
                    <EmptyListState
                      loading={loading}
                      message="No products yet. Create the first product."
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const english = getEnglishTranslation(
                    syncProductTranslations(product).translations
                  );

                  return (
                    <tr key={product.id} className="text-sm transition hover:bg-parchment/55">
                      <td data-label="ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                        #{product.id.toString().padStart(3, "0")}
                      </td>
                      <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">
                        {formatAdminDate(product.createdAt)}
                      </td>
                      <td data-label="Image" className="px-4 py-2.5">
                        <img
                          src={product.productImage}
                          alt={english?.name || "Product"}
                          className="h-12 w-12 rounded-md border border-mist bg-white object-contain p-1"
                        />
                      </td>
                      <td data-label="Code" className="px-4 py-2.5 font-mono text-xs text-ink/60">
                        {product.productCode}
                      </td>
                      <td data-label="Name" className="px-4 py-2.5 font-medium text-ink">
                        {english?.name || "Untitled product"}
                      </td>
                      <td data-label="Price" className="px-4 py-2.5 font-medium text-ink">
                        ₹{product.productPrice.toFixed(2)}
                      </td>
                      <td data-label="Status" className="px-4 py-2.5">
                        <StatusBadge status={product.status} />
                      </td>
                      <td data-label="Actions" className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormErrors({});
                              setDraft(syncProductTranslations(product));
                            }}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Edit product"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(product)}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Toggle product status"
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                            aria-label="Delete product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => loadProducts(page)}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Product Details</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {draft.id ? "Edit Product" : "Create Product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close product form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[240px_1fr]">
              <div className="space-y-4">
                <label className="block rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink">
                  Product Code <span className="text-red-500">*</span>
                  <input
                    type="text"
                    value={draft.productCode}
                    onChange={(event) => {
                      setFormErrors((current) => ({ ...current, productCode: undefined }));
                      setDraft({ ...draft, productCode: event.target.value });
                    }}
                    className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                    placeholder="RUDRA-001"
                  />
                  {formErrors.productCode && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.productCode}</p>
                  )}
                </label>

                <label className="block rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink">
                  Product Price <span className="text-red-500">*</span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={draft.productPrice}
                    onChange={(event) => {
                      setFormErrors((current) => ({ ...current, productPrice: undefined }));
                      setDraft({ ...draft, productPrice: Number(event.target.value) });
                    }}
                    className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                  />
                  {formErrors.productPrice && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.productPrice}</p>
                  )}
                </label>

                {(() => {
                  const maxDisplayOrder = draft.id ? totalRecords : totalRecords + 1;

                  return (
                <label className="block rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink">
                  Display Order <span className="text-red-500">*</span>
                  <input
                    type="number"
                    min={draft.id ? 1 : maxDisplayOrder}
                    max={maxDisplayOrder}
                    value={draft.displayOrder}
                    onChange={(event) => {
                      setFormErrors((current) => ({ ...current, displayOrder: undefined }));
                      setDraft({ ...draft, displayOrder: Number(event.target.value) });
                    }}
                    className="mt-2 w-28 rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                  />
                  <p className="mt-2 text-xs text-ink/45">
                    {draft.id ? `Allowed 1-${maxDisplayOrder}` : `Required ${maxDisplayOrder}`}
                  </p>
                  {formErrors.displayOrder && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.displayOrder}</p>
                  )}
                </label>
                  );
                })()}

                <label className="block rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink">
                  Product Image <span className="text-red-500">*</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => uploadProductImage(event.target.files?.[0])}
                    className="mt-2 block w-full text-xs text-ink/60 file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-ink/90"
                  />
                  <p className="mt-2 text-xs text-ink/45">
                    Upload image, or paste an image URL below.
                  </p>
                  <input
                    type="text"
                    value={draft.productImage}
                    onChange={(event) => {
                      setFormErrors((current) => ({ ...current, productImage: undefined }));
                      setDraft({ ...draft, productImage: event.target.value });
                    }}
                    className="mt-3 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                    placeholder="https://..."
                  />
                  {draft.productImage && (
                    <img
                      src={draft.productImage}
                      alt="Product preview"
                      className="mt-3 aspect-square w-full rounded-md border border-mist bg-white object-contain p-3"
                    />
                  )}
                  {formErrors.productImage && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.productImage}</p>
                  )}
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Product Content</h3>
                    <p className="mt-1 text-xs text-ink/55">
                      Add language-wise name and description.
                    </p>
                  </div>
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                    {draft.translations.length} Languages
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {draft.translations.map((translation, index) => (
                    <div
                      key={translation.lang}
                      className="rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{translation.label}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                          {translation.lang}
                        </span>
                      </div>

                      <label className="mt-4 block">
                        Name <span className="text-red-500">*</span>
                        <input
                          type="text"
                          value={translation.name}
                          onChange={(event) => {
                            const translations = [...draft.translations];
                            translations[index] = {
                              ...translation,
                              name: event.target.value,
                            };
                            setFormErrors((current) => ({
                              ...current,
                              names: { ...current.names, [translation.lang]: "" },
                            }));
                            setDraft({ ...draft, translations });
                          }}
                          className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                          placeholder={`Enter ${translation.label} name`}
                        />
                        {formErrors.names?.[translation.lang] && (
                          <p className="mt-2 text-xs text-red-600">
                            {formErrors.names[translation.lang]}
                          </p>
                        )}
                      </label>

                      <label className="mt-4 block">
                        Description
                        <textarea
                          value={translation.description}
                          onChange={(event) => {
                            const translations = [...draft.translations];
                            translations[index] = {
                              ...translation,
                              description: event.target.value,
                            };
                            setDraft({ ...draft, translations });
                          }}
                          rows={5}
                          className="mt-2 w-full resize-none rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                          placeholder={`Enter ${translation.label} description`}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
