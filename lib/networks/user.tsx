import { CreateUserType, UserType } from "../types/user";
import { axiosInstance } from "./axiosInstance";

export async function getAllUsers() {
  const { data } = await axiosInstance.get<UserType[]>("/users");
  return data;
}

export async function getUserById(id: string) {
  const { data } = await axiosInstance.get<UserType>("/users/" + id);
  return data;
}

export async function getUserByEmail(email: string) {
  const { data } = await axiosInstance.get<UserType>("/users/emails/" + email);
  return data;
}

export async function getTeacherByUserId(userId: string) {
  const { data } = await axiosInstance.get<UserType>(
    "/users/students/" + userId,
  );
  return data;
}

export async function getUsersByTeacherId(teacherId: string) {
  const { data } = await axiosInstance.get<UserType[]>(
    "/users/teachers/" + teacherId,
  );
  return data;
}

export async function createUser(values: CreateUserType) {
  const { data } = await axiosInstance.post("/users", values);
  return data;
}

export async function updateUser(id: string, values: CreateUserType) {
  console.log(values);
  const formData = new FormData();
  formData.append("fullName", values.fullName);
  formData.append("role", values.role);
  formData.append("email", values.email);

  const { data } = await axiosInstance.put(`/users/${id}`, formData);
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await axiosInstance.delete("/users/" + id);
  return data;
}
