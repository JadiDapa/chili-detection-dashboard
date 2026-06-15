export enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
}

export type CreateUserType = {
  fullName: string;
  email: string;
  role: Role;
};

export type UserType = CreateUserType & {
  id: string;
};
