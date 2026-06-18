"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
  ];

  const texts = [
    "Membimbing Pribadi Unggul",
    "Proses Pembelajaran Interaktif",
    "Bersama Membangun Karakter",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative hidden flex-1 lg:block">
      <figure>
        <Image
          src={
            "https://unsri.ac.id/images/fakultas/05026906-162b-42e8-a115-006e7d525678.JPG"
          }
          alt="Auth Carousel Image"
          fill
          className="object-cover object-center"
        />
      </figure>
    </div>
  );
}
