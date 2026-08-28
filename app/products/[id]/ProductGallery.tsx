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

  const showPrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setSelectedIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="min-w-0 space-y-4">
      {/* 主圖片 */}
      <div className="group relative flex min-h-[500px] items-center justify-center overflow-hidden rounded-[28px] bg-white p-3 shadow-sm">
        <img
          src={selectedImage}
          alt={`${productName} 商品圖片 ${selectedIndex + 1}`}
          className="max-h-[720px] w-full object-contain"
        />

        {/* 左右切換按鈕 */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="上一張商品圖片"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[#314f63] shadow-md transition hover:scale-105 hover:bg-white"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="下一張商品圖片"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[#314f63] shadow-md transition hover:scale-105 hover:bg-white"
            >
              ›
            </button>
          </>
        )}
    {/* 縮圖 */}
    {images.length > 1 && (
      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
              selectedIndex === index
               ? "border-[#314f63]"
               : "border-transparent hover:border-[#b9c7d0]"
             }`}
             aria-label={`查看第 ${index + 1} 張商品圖片`}
            >
              <div className="h-full w-full overflow-hidden rounded-lg bg-[#f1efea]">
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
        {/* 圖片編號 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      
    </div>
  );
}
