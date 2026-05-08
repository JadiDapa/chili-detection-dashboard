import { CreateCaptureType, CaptureType } from "../types/capture";
import { axiosInstance } from "./axiosInstance";

export async function getAllCaptures() {
  const { data } = await axiosInstance.get<CaptureType[]>("/captures");
  return data;
}

export async function getCaptureById(id: string) {
  const { data } = await axiosInstance.get<CaptureType>("/captures/" + id);
  return data;
}

export async function createCapture(values: CreateCaptureType) {
  const { data } = await axiosInstance.post("/captures", values);
  return data;
}

export async function updateCapture(id: string, values: CreateCaptureType) {
  const { data } = await axiosInstance.put(`/captures/${id}`, values);
  return data;
}

export async function deleteCapture(id: string) {
  const { data } = await axiosInstance.delete("/captures/" + id);
  return data;
}

export async function deleteAllSessionCaptures(id: string) {
  const { data } = await axiosInstance.delete("/captures/sessions/" + id);
  return data;
}
