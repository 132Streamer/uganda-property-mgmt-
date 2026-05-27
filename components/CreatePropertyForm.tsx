"use client";

import { useActionState, useRef, useState } from "react";
import { createProperty, CreatePropertyState } from "@/actions/createProperty";

const UGANDA_DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Mbarara", "Gulu", "Lira",
  "Mbale", "Masaka", "Entebbe", "Kasese", "Fort Portal", "Kabale",
  "Soroti", "Arua", "Hoima", "Tororo", "Iganga", "Masindi", "Mityana",
];

const PROPERTY_TYPES = [
  "Apartment", "House", "Studio", "Townhouse", "Villa",
  "Commercial", "Office Space", "Hostel Room",
];

const initialState: CreatePropertyState = {};

export default function CreatePropertyForm() {
  const [state, formAction, pending] = useActionState(createProperty, initialState);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 8) {
      setUploadError("Maximum 8 photos allowed.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const uploaded: string[] = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        setUploadError(json.error || "Upload failed.");
        setUploading(false);
        return;
      }

      uploaded.push(json.url);
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);

    // Reset file input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Add New Property
      </h1>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {state?.error && (
  <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
    {state.error}
  </div>
)}
        {/* Hidden photos field */}
        <input type="hidden" name="photos" value={JSON.stringify(photos)} />

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. 2-Bedroom Apartment in Kololo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Describe the property — amenities, nearby landmarks, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            name="address"
            type="text"
            required
            placeholder="e.g. Plot 14, Acacia Avenue"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* District + City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <select
              name="district"
              required
              defaultValue=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>
                Select district
              </option>
              {UGANDA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City / Town <span className="text-red-500">*</span>
            </label>
            <input
              name="city"
              type="text"
              required
              placeholder="e.g. Kampala"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Monthly Rent + Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Rent <span className="text-red-500">*</span>
            </label>
            <input
              name="monthly_rent"
              type="number"
              required
              min="0"
              step="1000"
              placeholder="e.g. 800000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              name="currency"
              defaultValue="UGX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="UGX">UGX</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Bedrooms + Bathrooms + Type */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms
            </label>
            <input
              name="bedrooms"
              type="number"
              min="0"
              max="20"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bathrooms
            </label>
            <input
              name="bathrooms"
              type="number"
              min="0"
              max="20"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              name="property_type"
              defaultValue=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos{" "}
            <span className="text-gray-400 font-normal">(max 8)</span>
          </label>

          {uploadError && (
            <p className="text-red-500 text-xs mb-2">{uploadError}</p>
          )}

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {photos.map((url) => (
                <div key={url} className="relative group aspect-square">
                  <img
                    src={url}
                    alt="Property photo"
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 8 && (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {uploading ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-gray-400 mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm text-gray-500">
                    Click to upload photos
                  </span>
                  <span className="text-xs text-gray-400">
                    JPEG, PNG, WebP · max 5MB each
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {pending ? "Creating property…" : "Create Property"}
        </button>
      </form>
    </div>
  );
}