import { useState } from "react";
import { toast } from "sonner";
import { X, Upload, Plus, Trash2, GripVertical } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const COLLECTIONS = [
  "operator",
  "kargil",
  "fearless",
  "bravest",
  "patriot",
];

const CATEGORIES = [
  "tees",
  "hoodies",
  "cargo",
  "caps",
  "accessories",
];

const BADGES = [
  "Limited Edition",
  "Bestseller",
  "One Time Drop",
];

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const emptyProduct = {
  slug: "",
  name: "",
  description: "",
  price: 0,
  compare_at_price: null,
  category: "tees",
  collection: "operator",
  images: [],
  sizes: DEFAULT_SIZES,
  colors: [
    {
      name: "Matte Black",
      hex: "#0A0A0A",
    },
  ],
  stock: 50,
  badges: [],
  is_new_drop: false,
  drop_ends_at: null,
  specs: {},
};

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function adminRequest(path, options = {}) {
  const token = localStorage.getItem("oc_token");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export default function AdminProductEditor({
  initial,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(initial);

  const [p, setP] = useState({
    ...emptyProduct,
    ...(initial || {}),
    images: Array.isArray(initial?.images)
      ? initial.images
      : [],
    badges: Array.isArray(initial?.badges)
      ? initial.badges
      : [],
    sizes: Array.isArray(initial?.sizes)
      ? initial.sizes
      : [...DEFAULT_SIZES],
    colors: Array.isArray(initial?.colors)
      ? initial.colors
      : [
          {
            name: "Matte Black",
            hex: "#0A0A0A",
          },
        ],
    specs: initial?.specs || {},
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [newSize, setNewSize] = useState("");

  const [newColor, setNewColor] = useState({
    name: "",
    hex: "#000000",
  });

  const [newSpec, setNewSpec] = useState({
    key: "",
    value: "",
  });

  const set = (key, value) => {
    setP((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // --------------------------------------------------
  // IMAGES
  // --------------------------------------------------

  const addImageUrl = () => {
    const url = imageUrl.trim();

    if (!url) {
      toast.error("Paste an image URL first.");
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      toast.error("Image URL must start with http or https.");
      return;
    }

    setP((current) => ({
      ...current,
      images: [...(current.images || []), url],
    }));

    setImageUrl("");

    toast.success("Image added.");
  };

  const uploadImage = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB.");
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("oc_token");

      const sigResponse = await fetch(
        `${API_BASE}/uploads/signature?folder=products/`,
        {
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      if (!sigResponse.ok) {
        throw new Error(
          "Cloudinary upload service is not configured."
        );
      }

      const sig = await sigResponse.json();

      if (
        sig.is_mock ||
        !sig.cloud_name ||
        !sig.api_key ||
        !sig.signature
      ) {
        throw new Error(
          "Cloudinary is not configured correctly."
        );
      }

      const form = new FormData();

      form.append("file", file);
      form.append("api_key", sig.api_key);
      form.append("timestamp", sig.timestamp);
      form.append("signature", sig.signature);
      form.append(
        "folder",
        sig.folder || "products/"
      );

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
        {
          method: "POST",
          body: form,
        }
      );

      const uploadData = await uploadResponse.json();

      if (
        !uploadResponse.ok ||
        !uploadData.secure_url
      ) {
        throw new Error(
          uploadData.error?.message ||
            "Cloudinary upload failed."
        );
      }

      setP((current) => ({
        ...current,
        images: [
          ...(current.images || []),
          uploadData.secure_url,
        ],
      }));

      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error.message || "Image upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const onFile = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    uploadImage(file);

    event.target.value = "";
  };

  const removeImage = (indexToRemove) => {
    setP((current) => ({
      ...current,
      images: (current.images || []).filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const moveImage = (fromIndex, toIndex) => {
    setP((current) => {
      const images = [...(current.images || [])];

      if (
        toIndex < 0 ||
        toIndex >= images.length
      ) {
        return current;
      }

      const [moved] = images.splice(fromIndex, 1);

      images.splice(toIndex, 0, moved);

      return {
        ...current,
        images,
      };
    });
  };

  // --------------------------------------------------
  // SIZES
  // --------------------------------------------------

  const toggleSize = (size) => {
    setP((current) => {
      const sizes = Array.isArray(current.sizes)
        ? current.sizes
        : [];

      return {
        ...current,
        sizes: sizes.includes(size)
          ? sizes.filter((item) => item !== size)
          : [...sizes, size],
      };
    });
  };

  const addCustomSize = () => {
    const size = newSize.trim();

    if (!size) {
      toast.error("Enter a size first.");
      return;
    }

    if (
      p.sizes?.some(
        (item) =>
          item.toLowerCase() === size.toLowerCase()
      )
    ) {
      toast.error("That size already exists.");
      return;
    }

    setP((current) => ({
      ...current,
      sizes: [
        ...(current.sizes || []),
        size,
      ],
    }));

    setNewSize("");
  };

  // --------------------------------------------------
  // COLORS
  // --------------------------------------------------

  const addColor = () => {
    const name = newColor.name.trim();

    if (!name) {
      toast.error("Enter a color name.");
      return;
    }

    setP((current) => ({
      ...current,
      colors: [
        ...(current.colors || []),
        {
          name,
          hex: newColor.hex || "#000000",
        },
      ],
    }));

    setNewColor({
      name: "",
      hex: "#000000",
    });

    toast.success("Color added.");
  };

  const updateColor = (index, key, value) => {
    setP((current) => {
      const colors = [...(current.colors || [])];

      colors[index] = {
        ...colors[index],
        [key]: value,
      };

      return {
        ...current,
        colors,
      };
    });
  };

  const removeColor = (index) => {
    setP((current) => ({
      ...current,
      colors: (current.colors || []).filter(
        (_, colorIndex) => colorIndex !== index
      ),
    }));
  };

  // --------------------------------------------------
  // SPECS
  // --------------------------------------------------

  const addSpec = () => {
    const key = newSpec.key.trim();
    const value = newSpec.value.trim();

    if (!key || !value) {
      toast.error(
        "Enter both specification name and value."
      );
      return;
    }

    setP((current) => ({
      ...current,
      specs: {
        ...(current.specs || {}),
        [key]: value,
      },
    }));

    setNewSpec({
      key: "",
      value: "",
    });
  };

  const removeSpec = (key) => {
    setP((current) => {
      const specs = {
        ...(current.specs || {}),
      };

      delete specs[key];

      return {
        ...current,
        specs,
      };
    });
  };

  // --------------------------------------------------
  // BADGES
  // --------------------------------------------------

  const toggleBadge = (badge) => {
    setP((current) => {
      const currentBadges = Array.isArray(
        current.badges
      )
        ? current.badges
        : [];

      return {
        ...current,
        badges: currentBadges.includes(badge)
          ? currentBadges.filter(
              (item) => item !== badge
            )
          : [...currentBadges, badge],
      };
    });
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validate = () => {
    if (!p.name.trim()) {
      toast.error("Product name is required.");
      return false;
    }

    if (!p.slug.trim()) {
      toast.error("Product slug is required.");
      return false;
    }

    if (
      !Number.isFinite(Number(p.price)) ||
      Number(p.price) <= 0
    ) {
      toast.error(
        "Product price must be greater than 0."
      );
      return false;
    }

    if (
      p.compare_at_price !== null &&
      p.compare_at_price !== "" &&
      Number(p.compare_at_price) < 0
    ) {
      toast.error(
        "Compare price cannot be negative."
      );
      return false;
    }

    if (Number(p.stock) < 0) {
      toast.error("Stock cannot be negative.");
      return false;
    }

    if (
      !Array.isArray(p.images) ||
      p.images.length === 0
    ) {
      toast.error(
        "Add at least one product image."
      );
      return false;
    }

    if (
      !Array.isArray(p.sizes) ||
      p.sizes.length === 0
    ) {
      toast.error(
        "Select at least one available size."
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // PAYLOAD
  // --------------------------------------------------

  const buildPayload = () => {
    return {
      ...p,

      slug: makeSlug(p.slug),

      name: String(p.name || "").trim(),

      description: String(
        p.description || ""
      ).trim(),

      price: Number(p.price || 0),

      compare_at_price:
        p.compare_at_price !== null &&
        p.compare_at_price !== ""
          ? Number(p.compare_at_price)
          : null,

      category:
        p.category || "tees",

      collection:
        p.collection || "operator",

      images: Array.isArray(p.images)
        ? p.images.filter(Boolean)
        : [],

      sizes: Array.isArray(p.sizes)
        ? p.sizes
        : [...DEFAULT_SIZES],

      colors: Array.isArray(p.colors)
        ? p.colors
            .filter((color) => color?.name)
            .map((color) => ({
              name: String(color.name).trim(),
              hex: color.hex || "#000000",
            }))
        : [],

      stock: Number(p.stock || 0),

      badges: Array.isArray(p.badges)
        ? p.badges
        : [],

      is_new_drop:
        Boolean(p.is_new_drop),

      drop_ends_at:
        p.drop_ends_at || null,

      specs: p.specs || {},
    };
  };

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const save = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isEdit) {
        await adminRequest(
          `/admin/products/${initial.slug}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );

        toast.success("Product updated.");
      } else {
        await adminRequest(
          "/admin/products",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        toast.success("Product created.");
      }

      await onSaved?.();

      onClose?.();
    } catch (error) {
      console.error(error);

      toast.error(
        error.message || "Save failed."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 overflow-y-auto"
      data-testid="product-editor"
    >
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="w-full max-w-4xl bg-ink-900 border border-ink-500 my-8">

          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-ink-500 sticky top-0 bg-ink-900 z-10">
            <div>
              <p className="label-tiny text-gold mb-1">
                PRODUCT CMS
              </p>

              <h2 className="display text-2xl">
                {isEdit
                  ? "EDIT PRODUCT"
                  : "NEW PRODUCT"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:text-gold"
              data-testid="close-editor"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={save}
            className="p-5 space-y-8"
          >

            {/* -------------------------------- */}
            {/* BASIC INFORMATION */}
            {/* -------------------------------- */}

            <Section
              number="01"
              title="Basic Information"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <Field
                  label="Product Name"
                  value={p.name}
                  onChange={(value) => {
                    set("name", value);

                    if (
                      !isEdit &&
                      !p.slug
                    ) {
                      set(
                        "slug",
                        makeSlug(value)
                      );
                    }
                  }}
                  testid="ed-name"
                />

                <Field
                  label="Slug / URL"
                  value={p.slug}
                  onChange={(value) =>
                    set(
                      "slug",
                      makeSlug(value)
                    )
                  }
                  testid="ed-slug"
                  disabled={isEdit}
                />
              </div>

              <div className="mt-3">
                <label className="label-tiny block mb-1">
                  Description
                </label>

                <textarea
                  value={
                    p.description || ""
                  }
                  onChange={(event) =>
                    set(
                      "description",
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Write the complete product description..."
                  className="input-oc resize-y"
                  data-testid="ed-desc"
                />
              </div>
            </Section>

            {/* -------------------------------- */}
            {/* PRICING */}
            {/* -------------------------------- */}

            <Section
              number="02"
              title="Pricing & Inventory"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <Field
                  label="Selling Price (₹)"
                  type="number"
                  value={p.price}
                  onChange={(value) =>
                    set(
                      "price",
                      Number(value)
                    )
                  }
                  testid="ed-price"
                />

                <Field
                  label="Original Price (₹)"
                  type="number"
                  value={
                    p.compare_at_price ?? ""
                  }
                  onChange={(value) =>
                    set(
                      "compare_at_price",
                      value
                        ? Number(value)
                        : null
                    )
                  }
                  testid="ed-compare"
                />

                <Field
                  label="Stock Quantity"
                  type="number"
                  value={p.stock}
                  onChange={(value) =>
                    set(
                      "stock",
                      Number(value)
                    )
                  }
                  testid="ed-stock"
                />
              </div>

              <div className="mt-4 p-4 border border-ink-500 bg-black/20">
                <p className="label-tiny text-neutral-400">
                  PRODUCT PREVIEW
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-semibold">
                    ₹{Number(p.price || 0).toLocaleString("en-IN")}
                  </span>

                  {p.compare_at_price && (
                    <span className="text-sm text-neutral-500 line-through">
                      ₹
                      {Number(
                        p.compare_at_price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  )}

                  <span className="text-xs text-neutral-500">
                    {p.stock} in stock
                  </span>
                </div>
              </div>
            </Section>

            {/* -------------------------------- */}
            {/* CLASSIFICATION */}
            {/* -------------------------------- */}

            <Section
              number="03"
              title="Classification"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <Select
                  label="Category"
                  value={p.category}
                  onChange={(value) =>
                    set("category", value)
                  }
                  options={CATEGORIES}
                  testid="ed-cat"
                />

                <Select
                  label="Collection"
                  value={p.collection}
                  onChange={(value) =>
                    set(
                      "collection",
                      value
                    )
                  }
                  options={COLLECTIONS}
                  testid="ed-col"
                />
              </div>

              <div className="mt-4">
                <label className="label-tiny block mb-2">
                  Badges
                </label>

                <div className="flex flex-wrap gap-2">
                  {BADGES.map((badge) => (
                    <button
                      type="button"
                      key={badge}
                      onClick={() =>
                        toggleBadge(badge)
                      }
                      className={`label-tiny px-3 py-2 border transition ${
                        p.badges?.includes(
                          badge
                        )
                          ? "border-gold text-gold bg-gold/5"
                          : "border-ink-500 text-neutral-400 hover:border-neutral-400"
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* -------------------------------- */}
            {/* NEW DROP */}
            {/* -------------------------------- */}

            <Section
              number="04"
              title="Mission / Drop Settings"
            >
              <label className="flex items-center gap-3 cursor-pointer border border-ink-500 p-4 hover:border-gold">
                <input
                  type="checkbox"
                  checked={Boolean(
                    p.is_new_drop
                  )}
                  onChange={(event) =>
                    set(
                      "is_new_drop",
                      event.target.checked
                    )
                  }
                  className="w-4 h-4 accent-current"
                />

                <div>
                  <p className="label-tiny">
                    FEATURE AS NEW DROP
                  </p>

                  <p className="text-xs text-neutral-500 mt-1">
                    This product will appear in
                    the Mission Board / New Drop
                    product sections.
                  </p>
                </div>
              </label>

              {p.is_new_drop && (
                <div className="mt-3">
                  <Field
                    label="Drop Ends At"
                    type="datetime-local"
                    value={
                      p.drop_ends_at
                        ? String(
                            p.drop_ends_at
                          ).slice(
                            0,
                            16
                          )
                        : ""
                    }
                    onChange={(value) =>
                      set(
                        "drop_ends_at",
                        value || null
                      )
                    }
                  />
                </div>
              )}
            </Section>

            {/* -------------------------------- */}
            {/* SIZES */}
            {/* -------------------------------- */}

            <Section
              number="05"
              title="Available Sizes"
            >
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SIZES.map(
                  (size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() =>
                        toggleSize(size)
                      }
                      className={`min-w-[52px] px-3 py-2 border label-tiny ${
                        p.sizes?.includes(size)
                          ? "border-gold text-gold bg-gold/5"
                          : "border-ink-500 text-neutral-500"
                      }`}
                    >
                      {size}
                    </button>
                  )
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  value={newSize}
                  onChange={(event) =>
                    setNewSize(
                      event.target.value
                    )
                  }
                  placeholder="Custom size e.g. 3XL"
                  className="input-oc"
                />

                <button
                  type="button"
                  onClick={addCustomSize}
                  className="btn-outline shrink-0"
                >
                  <Plus size={15} />
                  ADD
                </button>
              </div>

              {p.sizes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {p.sizes.map(
                    (size) => (
                      <span
                        key={size}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-xs"
                      >
                        {size}

                        <button
                          type="button"
                          onClick={() =>
                            toggleSize(size)
                          }
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )
                  )}
                </div>
              )}
            </Section>

            {/* -------------------------------- */}
            {/* COLORS */}
            {/* -------------------------------- */}

            <Section
              number="06"
              title="Product Colors"
            >
              <div className="space-y-2">
                {(p.colors || []).map(
                  (color, index) => (
                    <div
                      key={`${color.name}-${index}`}
                      className="flex items-center gap-2 border border-ink-500 p-2"
                    >
                      <input
                        type="color"
                        value={
                          color.hex ||
                          "#000000"
                        }
                        onChange={(event) =>
                          updateColor(
                            index,
                            "hex",
                            event.target.value
                          )
                        }
                        className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                      />

                      <input
                        value={
                          color.name || ""
                        }
                        onChange={(event) =>
                          updateColor(
                            index,
                            "name",
                            event.target.value
                          )
                        }
                        className="input-oc"
                        placeholder="Color name"
                      />

                      <input
                        value={
                          color.hex || ""
                        }
                        onChange={(event) =>
                          updateColor(
                            index,
                            "hex",
                            event.target.value
                          )
                        }
                        className="input-oc max-w-[130px]"
                        placeholder="#000000"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeColor(index)
                        }
                        className="p-2 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 mt-3">
                <input
                  value={newColor.name}
                  onChange={(event) =>
                    setNewColor(
                      (current) => ({
                        ...current,
                        name: event.target.value,
                      })
                    )
                  }
                  placeholder="New color name"
                  className="input-oc"
                />

                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(event) =>
                    setNewColor(
                      (current) => ({
                        ...current,
                        hex: event.target.value,
                      })
                    )
                  }
                  className="input-oc h-[42px] p-1"
                />

                <button
                  type="button"
                  onClick={addColor}
                  className="btn-outline"
                >
                  <Plus size={15} />
                  ADD COLOR
                </button>
              </div>
            </Section>

            {/* -------------------------------- */}
            {/* IMAGES */}
            {/* -------------------------------- */}

            <Section
              number="07"
              title="Product Images"
            >
              <div className="flex gap-2 mb-3">
                <input
                  value={imageUrl}
                  onChange={(event) =>
                    setImageUrl(
                      event.target.value
                    )
                  }
                  placeholder="Paste image URL here"
                  className="input-oc"
                />

                <button
                  type="button"
                  onClick={addImageUrl}
                  className="btn-outline shrink-0"
                >
                  <Plus size={15} />
                  ADD
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(p.images || []).map(
                  (src, index) => (
                    <div
                      key={`${src}-${index}`}
                      className="relative group aspect-[3/4] bg-ink-700 border border-white/10 overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.opacity =
                            "0.2";
                        }}
                      />

                      <div className="absolute top-1 left-1 bg-black/70 px-2 py-1 text-[10px]">
                        {index === 0
                          ? "PRIMARY"
                          : `IMAGE ${index + 1}`}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-1 flex gap-1 bg-black/70 opacity-0 group-hover:opacity-100 transition">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              moveImage(
                                index,
                                index - 1
                              )
                            }
                            className="p-1 bg-white/10 hover:bg-white/20"
                            title="Move left"
                          >
                            ←
                          </button>
                        )}

                        {index <
                          (p.images?.length ||
                            0) -
                            1 && (
                          <button
                            type="button"
                            onClick={() =>
                              moveImage(
                                index,
                                index + 1
                              )
                            }
                            className="p-1 bg-white/10 hover:bg-white/20"
                            title="Move right"
                          >
                            →
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(index)
                          }
                          className="p-1 bg-red-500/20 text-red-300 hover:bg-red-500/40 ml-auto"
                          data-testid={`rm-img-${index}`}
                        >
                          <Trash2
                            size={13}
                          />
                        </button>
                      </div>
                    </div>
                  )
                )}

                <label
                  className="aspect-[3/4] border border-dashed border-ink-500 flex items-center justify-center cursor-pointer hover:border-gold"
                  data-testid="upload-image"
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onFile}
                    disabled={uploading}
                  />

                  <div className="text-center text-xs text-neutral-400">
                    <Upload
                      size={20}
                      className="mx-auto mb-1"
                    />

                    {uploading
                      ? "UPLOADING..."
                      : "UPLOAD IMAGE"}
                  </div>
                </label>
              </div>

              <p className="text-xs text-neutral-500 mt-3">
                The first image is the primary
                product image. Use the arrows to
                change image order.
              </p>
            </Section>

            {/* -------------------------------- */}
            {/* SPECIFICATIONS */}
            {/* -------------------------------- */}

            <Section
              number="08"
              title="Specifications"
            >
              <div className="space-y-2">
                {Object.entries(
                  p.specs || {}
                ).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 border border-ink-500 p-2"
                    >
                      <div className="w-1/3 text-sm text-neutral-300">
                        {key}
                      </div>

                      <div className="flex-1 text-sm text-neutral-400">
                        {value}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeSpec(key)
                        }
                        className="p-2 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 mt-3">
                <input
                  value={newSpec.key}
                  onChange={(event) =>
                    setNewSpec(
                      (current) => ({
                        ...current,
                        key: event.target.value,
                      })
                    )
                  }
                  placeholder="Specification e.g. Material"
                  className="input-oc"
                />

                <input
                  value={newSpec.value}
                  onChange={(event) =>
                    setNewSpec(
                      (current) => ({
                        ...current,
                        value:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Value e.g. 100% Cotton"
                  className="input-oc"
                />

                <button
                  type="button"
                  onClick={addSpec}
                  className="btn-outline"
                >
                  <Plus size={15} />
                  ADD
                </button>
              </div>
            </Section>

            {/* -------------------------------- */}
            {/* SAVE */}
            {/* -------------------------------- */}

            <div className="border-t border-ink-500 pt-5 flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline flex-1"
                data-testid="cancel-editor"
                disabled={saving}
              >
                CANCEL
              </button>

              <button
                type="submit"
                className="btn-primary flex-1"
                data-testid="save-product"
                disabled={
                  saving || uploading
                }
              >
                {saving
                  ? "SAVING..."
                  : isEdit
                  ? "SAVE PRODUCT"
                  : "CREATE PRODUCT"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// REUSABLE UI
// --------------------------------------------------

function Section({ number, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gold">
          {number}
        </span>

        <h3 className="display text-lg">
          {title}
        </h3>

        <div className="h-px bg-ink-500 flex-1" />
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  testid,
  disabled,
}) {
  return (
    <div>
      <label className="label-tiny block mb-1">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="input-oc disabled:opacity-60"
        data-testid={testid}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  testid,
}) {
  return (
    <div>
      <label className="label-tiny block mb-1">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="input-oc"
        data-testid={testid}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}