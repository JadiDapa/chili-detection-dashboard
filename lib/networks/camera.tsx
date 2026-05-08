import { axiosInstance } from "./axiosInstance";

export async function startCameraStream() {
  const { data } = await axiosInstance.post("/camera/stream");
  return data;
}

export async function stopCameraStream() {
  const { data } = await axiosInstance.post("/camera/stop");
  return data;
}

export async function getCameraCapture() {
  const { data } = await axiosInstance("/camera/captures");
  return data;
}
