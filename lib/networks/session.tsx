import { axiosInstance } from "./axiosInstance";

export async function getSessionStatus() {
  const { data } = await axiosInstance("/session/status");
  return data;
}

export async function startSession() {
  const { data } = await axiosInstance.post("/session/start");
  return data;
}

export async function restartSession() {
  const { data } = await axiosInstance.post("/session/restart");
  return data;
}

export async function stopSession() {
  const { data } = await axiosInstance.post("/sessions/stop");
  return data;
}

export async function pauseSession() {
  const { data } = await axiosInstance.post("/sessions/pause");
  return data;
}

export async function resumeSession() {
  const { data } = await axiosInstance.post("/sessions/resume");
  return data;
}
