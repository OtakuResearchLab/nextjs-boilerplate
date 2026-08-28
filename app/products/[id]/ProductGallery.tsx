"use client";

import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[28px] bg-[#e9e6df] text-[#8c8c8c]">
        暫無商品圖片
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];

  return (
    <div className="space-y-4">
      {/* 主圖片 */}
      <div className="flex min-h-[500px] items-center justify-center overflow-hidden rounded-[28px] bg-white p-3 shadow-sm">
        <img
          src={selectedImage}
          alt={`${productName} 商品圖片 ${selectedIndex + 1}`}
          className="max-h-[720px] w-full object-contain"
        />
      </div>

      {/* 縮圖 */}
      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
                selectedIndex === index
                  ? "border-[#314f63]"
                  : "border-transparent hover:border-[#b9c7d0]"
              }`}
              aria-label={`查看第 ${index + 1} 張商品圖片`}
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-[#f1efea]">
                <img
                  src={image}
                  alt={`${productName} 縮圖 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
