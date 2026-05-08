"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CapturedCard from "@/components/root/sessions/CapturedCard";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { restartSession } from "@/lib/networks/session";
import { Captures } from "@/generated/prisma";

export default function SessionCaptures({
  captures,
  id,
}: {
  captures: Captures[];
  id: string;
}) {
  const qc = useQueryClient();

  const { mutateAsync: deleteAllCaptures } = useMutation({
    mutationFn: () => restartSession(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", id] });
      toast.success(`Session Restarted!`);
    },
    onError: () => {
      toast.error("Failed to Restart Session!");
    },
  });

  return (
    <Card>
      <CardContent>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Latest Capture</CardTitle>
            <Button
              onClick={() => deleteAllCaptures()}
              className="text-background flex cursor-pointer items-center gap-2 hover:opacity-70"
            >
              <Trash />
              <p>Restart Session!</p>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Swiper
            modules={[FreeMode]}
            slidesPerView="auto"
            freeMode
            className="mt-4 overflow-visible"
          >
            {captures?.map((capture, index) => (
              <SwiperSlide className="me-6 max-w-fit" key={capture.id}>
                <CapturedCard capture={capture} index={index + 1} />
              </SwiperSlide>
            ))}
          </Swiper>
        </CardContent>
      </CardContent>
    </Card>
  );
}
