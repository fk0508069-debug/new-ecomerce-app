"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X, Upload, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_DATA = {
  Fashion: {
    Men: [
      "Shirts",
      "T-Shirts",
      "Jeans",
      "Trousers",
      "Jackets",
      "Hoodies",
      "Suits",
    ],
    Women: [
      "Dresses",
      "Tops",
      "Jeans",
      "Trousers",
      "Jackets",
      "Abayas",
      "Scarves",
    ],
    Kids: [
      "Boys Clothing",
      "Girls Clothing",
      "Kids T-Shirts",
      "Kids Dresses",
      "School Wear",
    ],
    Footwear: [
      "Sneakers",
      "Formal Shoes",
      "Sandals",
      "Slippers",
      "Boots",
    ],
    Accessories: [
      "Bags",
      "Belts",
      "Wallets",
      "Caps",
      "Sunglasses",
      "Watches",
    ],
  },

  Toys: {
    "Educational Toys": [
      "STEM Toys",
      "Learning Games",
      "Puzzles",
      "Building Blocks",
      "Educational Kits",
    ],
    "Action & Figures": [
      "Action Figures",
      "Dolls",
      "Collectible Figures",
      "Toy Soldiers",
    ],
    "Outdoor Toys": [
      "RC Cars",
      "Sports Toys",
      "Ride-on Toys",
      "Water Toys",
      "Outdoor Games",
    ],
    "Baby Toys": [
      "Rattles",
      "Teethers",
      "Soft Toys",
      "Musical Toys",
    ],
  },

  "Smart Products": {
    "Smart Home": [
      "Smart Lights",
      "Smart Plugs",
      "Smart Cameras",
      "Smart Doorbells",
      "Smart Sensors",
    ],
    Wearables: [
      "Smart Watches",
      "Fitness Bands",
      "Smart Rings",
      "Health Trackers",
    ],
    "Smart Accessories": [
      "Smart Trackers",
      "Wireless Chargers",
      "Smart Hubs",
      "Smart Remote Controls",
    ],
    "Security Devices": [
      "Smart Locks",
      "Security Cameras",
      "Video Doorbells",
      "Alarm Systems",
    ],
  },

  Electronics: {
    Mobile: [
      "Smartphones",
      "Feature Phones",
      "Phone Cases",
      "Screen Protectors",
      "Power Banks",
      "Chargers",
    ],
    Computers: [
      "Laptops",
      "Desktop Computers",
      "Keyboards",
      "Mice",
      "Webcams",
      "USB Hubs",
    ],
    Audio: [
      "Headphones",
      "Earbuds",
      "Speakers",
      "Microphones",
      "Soundbars",
    ],
    "TV & Entertainment": [
      "Smart TVs",
      "Streaming Devices",
      "Projectors",
      "TV Accessories",
    ],
    Cameras: [
      "Digital Cameras",
      "Action Cameras",
      "Security Cameras",
      "Camera Accessories",
    ],
  },

  "Home & Living": {
    Furniture: [
      "Sofas",
      "Chairs",
      "Tables",
      "Beds",
      "Wardrobes",
      "Desks",
    ],
    Kitchen: [
      "Cookware",
      "Kitchen Tools",
      "Storage Containers",
      "Dinnerware",
      "Small Appliances",
    ],
    Decor: [
      "Wall Decor",
      "Lamps",
      "Clocks",
      "Artificial Plants",
      "Home Accessories",
    ],
    Storage: [
      "Storage Boxes",
      "Shelves",
      "Organizers",
      "Laundry Storage",
    ],
  },

  Beauty: {
    Skincare: [
      "Face Wash",
      "Moisturizers",
      "Serums",
      "Sunscreen",
      "Face Masks",
    ],
    Haircare: [
      "Shampoo",
      "Conditioner",
      "Hair Oil",
      "Hair Styling",
    ],
    Makeup: [
      "Foundation",
      "Lipstick",
      "Mascara",
      "Eyeshadow",
      "Makeup Brushes",
    ],
    Fragrance: [
      "Perfumes",
      "Body Sprays",
      "Attars",
      "Deodorants",
    ],
  },

  Sports: {
    Fitness: [
      "Dumbbells",
      "Resistance Bands",
      "Yoga Mats",
      "Exercise Equipment",
    ],
    Football: [
      "Football",
      "Football Shoes",
      "Football Jerseys",
      "Football Accessories",
    ],
    Cricket: [
      "Cricket Bats",
      "Cricket Balls",
      "Cricket Gloves",
      "Cricket Kits",
    ],
    Outdoor: [
      "Camping Equipment",
      "Hiking Gear",
      "Cycling Accessories",
      "Sports Bags",
    ],
  },
};

export default function AddProductPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    subsubcategory: "",
    stock: "0",
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const categories = Object.keys(CATEGORY_DATA);

  const subcategories = formData.category
    ? Object.keys(CATEGORY_DATA[formData.category])
    : [];

  const subsubcategories =
    formData.category && formData.subcategory
      ? CATEGORY_DATA[formData.category][formData.subcategory]
      : [];

  const handleCategoryChange = (e) => {
    const category = e.target.value;

    setFormData((prev) => ({
      ...prev,
      category,
      subcategory: "",
      subsubcategory: "",
    }));
  };

  const handleSubcategoryChange = (e) => {
    const subcategory = e.target.value;

    setFormData((prev) => ({
      ...prev,
      subcategory,
      subsubcategory: "",
    }));
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;

    try {
      const imagePromises = Array.from(files).map(
        (file) =>
          new Promise((resolve, reject) => {
            if (!file.type.startsWith("image/")) {
              reject(new Error("Only image files are allowed"));
              return;
            }

            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);

            reader.onerror = () =>
              reject(new Error("Failed to read image"));

            reader.readAsDataURL(file);
          })
      );

      const result = await Promise.all(imagePromises);

      setImages((prev) => [...prev, ...result]);
      setError("");
    } catch (err) {
      setError(
        err.message ||
          "One or more images could not be uploaded. Please try again."
      );
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    handleImageUpload(e.dataTransfer.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!images.length) {
      setError("Please upload at least one product image.");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.price ||
      !formData.category ||
      !formData.subcategory ||
      !formData.subsubcategory
    ) {
      setError("Please complete all required product fields.");
      return;
    }

    if (Number(formData.price) < 0) {
      setError("Product price cannot be negative.");
      return;
    }

    if (Number(formData.stock) < 0) {
      setError("Stock cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          category: formData.category,
          subcategory: formData.subcategory,
          subsubcategory: formData.subsubcategory,
          stock: Number(formData.stock || 0),
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 text-slate-600">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />

          <p className="mt-4 font-medium">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Admin Panel
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Add New Product
            </h1>

            <p className="mt-1 text-slate-600">
              Add product information, categories and images
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="mt-0.5 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <span className="font-bold text-red-600">!</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 transition hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
          >

            {/* Product Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                required
                placeholder="e.g. Premium Wireless Headphones"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                required
                rows={5}
                placeholder="Write a detailed product description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Price / Stock */}
            <div className="grid gap-5 sm:grid-cols-2">

              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Price <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    Rs.
                  </span>

                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Stock
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* Category Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">
                  Product Category
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the most specific category for this product.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">

                {/* Main Category */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      required
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subcategory{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      required
                      disabled={!formData.category}
                      value={formData.subcategory}
                      onChange={handleSubcategoryChange}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {formData.category
                          ? "Select subcategory"
                          : "Select category first"}
                      </option>

                      {subcategories.map((subcategory) => (
                        <option
                          key={subcategory}
                          value={subcategory}
                        >
                          {subcategory}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Sub-subcategory */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Type{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      required
                      disabled={!formData.subcategory}
                      value={formData.subsubcategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subsubcategory: e.target.value,
                        })
                      }
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {formData.subcategory
                          ? "Select product type"
                          : "Select subcategory first"}
                      </option>

                      {subsubcategories.map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Category Preview */}
              {formData.category &&
                formData.subcategory &&
                formData.subsubcategory && (
                  <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Selected Category
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formData.category}
                      <span className="mx-2 text-slate-400">
                        /
                      </span>
                      {formData.subcategory}
                      <span className="mx-2 text-slate-400">
                        /
                      </span>
                      {formData.subsubcategory}
                    </p>
                  </div>
                )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Product Images{" "}
                <span className="text-red-500">*</span>

                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({images.length} uploaded)
                </span>
              </label>

              {/* Drag and Drop */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition ${
                  dragActive
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-300 bg-slate-50 hover:border-amber-400"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    handleImageUpload(e.target.files)
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="rounded-full bg-amber-100 p-4">
                    <Upload className="h-6 w-6 text-amber-600" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    Drag images here or click to browse
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    You can upload multiple images. Supported
                    formats: JPG, PNG, WebP
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Preview
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="group relative"
                      >
                        <img
                          src={image}
                          alt={`Product preview ${index + 1}`}
                          className="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200"
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -right-2 -top-2 hidden rounded-full bg-red-500 p-1.5 text-white shadow-lg transition hover:bg-red-600 group-hover:block"
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>

                        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                          {index + 1}
                        </div>

                        {index === 0 && (
                          <div className="absolute left-2 top-2 rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-linear-to-r from-amber-500 to-amber-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving Product...
                  </span>
                ) : (
                  "Save Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
