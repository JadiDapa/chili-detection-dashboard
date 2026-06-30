"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { startCameraStream, stopCameraStream } from "@/lib/networks/camera";
import { CAMERA_ASPECT_CLASS } from "@/lib/camera";

export function LiveCamera() {
  const [cameraActive, setCameraActive] = useState(true);
  const streamUrl = `http://127.0.0.1:8000/camera/stream?ts=${new Date()}`;

  async function toggleCamera() {
    try {
      if (!cameraActive) {
        await startCameraStream();
        setCameraActive(true);
        toast.success("Camera activated");
      } else {
        await stopCameraStream();
        setCameraActive(false);
        toast.success("Camera disabled");
      }
    } catch {
      toast.error("Failed to control camera");
      window.location.reload();
    }
  }

  return (
    <Card className="lg:col-span-7">
      <CardContent>
        <div
          className={`relative ${CAMERA_ASPECT_CLASS} w-full overflow-hidden rounded-xl border p-4 shadow`}
        >
          {cameraActive ? (
            <figure className="">
              <Image
                unoptimized
                src={streamUrl}
                alt="Live Camera"
                fill
                className="h-full w-full object-cover"
                onError={() => {
                  setCameraActive(false);
                  toast.error("Camera Stream Disabled");
                }}
              />
            </figure>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Camera is disabled
            </div>
          )}
        </div>
      </CardContent>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Camera Feed</CardTitle>
          <div className="flex justify-end gap-2">
            <Button onClick={toggleCamera} variant="outline">
              {cameraActive ? "Disable Camera" : "Activate Camera"}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
