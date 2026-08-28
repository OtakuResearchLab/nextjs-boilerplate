"use client";

import { useRef, useState } from "react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-[28px] bg-[#e9e6df] text-[#8c8c8c]">
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

  const scrollThumbnailsLeft = () => {
    thumbnailRef.current?.scrollBy({
      left: -260,
      behavior: "smooth",
    });
  };

  const scrollThumbnailsRight = () => {
    thumbnailRef.current?.scrollBy({
      left: 260,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-w-0 space-y-3">
      {/* 固定尺寸主圖片區 */}
      <div className="group relative flex h-[560px] items-center justify-center overflow-hidden rounded-[28px] bg-white p-4 shadow-sm">
        <img
          src={selectedImage}
          alt={`${productName} 商品圖片 ${selectedIndex + 1}`}
          className="max-h-full max-w-full object-contain"
        />

        {/* 主圖左右切換 */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="上一張商品圖片"
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[#314f63] shadow-md transition hover:scale-105 hover:bg-white"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="下一張商品圖片"
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[#314f63] shadow-md transition hover:scale-105 hover:bg-white"
            >
              ›
            </button>
          </>
        )}

        {/* 圖片編號 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 縮圖列 */}
      {images.length > 1 && (
        <div className="relative">
          {images.length > 5 && (
            <button
              type="button"
              onClick={scrollThumbnailsLeft}
              aria-label="縮圖向左移動"
              className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#314f63] shadow-md"
            >
              ‹
            </button>
          )}

          <div
            ref={thumbnailRef}
            className="overflow-x-auto scroll-smooth pb-1"
          >
            <div className="flex w-max gap-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`h-[82px] w-[82px] shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
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
          </div>

          {images.length > 5 && (
            <button
              type="button"
              onClick={scrollThumbnailsRight}
              aria-label="縮圖向右移動"
              className="absolute right-0 top-1/2 z-10 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#314f63] shadow-md"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
