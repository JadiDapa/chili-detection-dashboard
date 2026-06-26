"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = ["/auth-1.jpeg", "/auth-2.jpg", "/auth-3.jpg"];

  const slides = [
    {
      title: "Deteksi Cabai Real-Time dengan Computer Vision",
      subtitle:
        "Pantau tingkat kematangan cabai secara otomatis menggunakan model YOLO dengan hasil deteksi yang cepat dan akurat.",
    },
    {
      title: "Kontrol Perangkat Greenhouse Secara Otomatis",
      subtitle:
        "Kelola pompa air, kipas, lampu, dan perangkat lainnya langsung dari dashboard kapan pun dibutuhkan.",
    },
    {
      title: "Monitoring Suhu, Kelembapan, dan Cahaya",
      subtitle:
        "Lihat data sensor secara real-time untuk menjaga kondisi lingkungan greenhouse tetap optimal bagi pertumbuhan tanaman.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative hidden flex-1 overflow-hidden lg:block">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt={`Auth Carousel Image ${index + 1}`}
            fill
            priority={index === 0}
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* Dark overlay so the caption stays readable */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Caption */}
      {/* Caption */}
      <div className="absolute right-0 bottom-20 left-0 px-10 text-center">
        <h2 className="text-3xl font-semibold text-white">
          {slides[currentIndex].title}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90">
          {slides[currentIndex].subtitle}
        </p>
      </div>

      {/* Indicators */}
      <div className="absolute right-0 bottom-8 left-0 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
