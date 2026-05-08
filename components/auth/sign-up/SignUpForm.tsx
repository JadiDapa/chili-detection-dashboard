"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeClosed, LoaderCircle, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useMutation } from "@tanstack/react-query";
import { createUser } from "@/lib/networks/user";
import { CreateUserType, Role } from "@/lib/types/user";

// Validation schema
const signupSchema = z
  .object({
    fullname: z.string().min(3, "Nama harus minimal 3 karakter"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password harus minimal 3 karakter"),
    confirmPassword: z.string().min(6, "Password harus minimal 3 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password Tidak Sama",
  });

const verifySchema = z.object({
  code: z.string().length(6, "Kode OTP harus 6 karakter"),
});

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [signupData, setSignupData] = useState<z.infer<
    typeof signupSchema
  > | null>(null);

  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const { mutateAsync: createUserAsync } = useMutation({
    mutationFn: (values: CreateUserType) => createUser(values),
    onError: () => toast.error("Something Went Wrong!"),
  });

  const form = useForm({
    resolver: zodResolver(pendingVerification ? verifySchema : signupSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
  });

  // Step 1: Create user
  async function onSubmit(values: z.infer<typeof signupSchema>) {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      setSignupData(values); // save for later

      await signUp.create({
        emailAddress: values.email,
        password: values.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      form.setValue("code", "");

      toast.info("Verification code sent to your email.");
    } catch (error: any) {
      console.error("Sign-up error:", error);
      toast.error(error.errors?.[0]?.message || "Sign-up failed.");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Verify email
  async function onVerify(values: z.infer<typeof verifySchema>) {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: values.code!,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });

        await createUserAsync({
          fullName: signupData?.fullname ?? "",
          email: signUp.emailAddress!,
          role: Role.STUDENT,
        });

        toast.success("Account created successfully!");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.errors?.[0]?.message || "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFormSubmit(
    values: z.infer<typeof signupSchema> | z.infer<typeof verifySchema>
  ) {
    if (pendingVerification) {
      await onVerify(values as z.infer<typeof verifySchema>);
    } else {
      await onSubmit(values as z.infer<typeof signupSchema>);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleFormSubmit)}
      className=" w-full lg:mt-6 "
    >
      <FieldGroup {...form}>
        <div className="space-y-4">
          {!pendingVerification ? (
            <>
              {/* Full Name */}
              <Controller
                control={form.control}
                name="fullname"
                render={({ field, fieldState }) => (
                  <Field className="">
                    <InputGroup className="h-12">
                      <InputGroupInput
                        {...field}
                        className="ml-2"
                        aria-invalid={fieldState.invalid}
                        placeholder="Full Name"
                        autoComplete="off"
                      />
                      <InputGroupAddon>
                        <User />
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field className="relative">
                    <InputGroup className="h-12">
                      <InputGroupInput
                        {...field}
                        className="ml-2"
                        aria-invalid={fieldState.invalid}
                        placeholder="Email"
                        autoComplete="new-email"
                      />
                      <InputGroupAddon>
                        <Mail />
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Password */}
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field className="relative">
                    <InputGroup className="h-12">
                      <InputGroupAddon>
                        <Lock />
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        className="ml-2"
                        type={isVisible ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        placeholder="Password"
                        autoComplete="off"
                      />
                      <InputGroupAddon
                        align="inline-end"
                        onClick={() => setIsVisible(!isVisible)}
                      >
                        {isVisible ? <Eye /> : <EyeClosed />}
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {/* Confirm Password */}
              <Controller
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Field className="relative">
                    <InputGroup className="h-12">
                      <InputGroupAddon>
                        <Lock />
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        className="ml-2"
                        type={isVisible ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        placeholder="Confirm Password"
                        autoComplete="off"
                      />
                      <InputGroupAddon
                        align="inline-end"
                        onClick={() => setIsVisible(!isVisible)}
                      >
                        {isVisible ? <Eye /> : <EyeClosed />}
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </>
          ) : (
            <Controller
              control={form.control}
              name="code"
              render={({ field, fieldState }) => (
                <Field className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
        </div>

        <Button
          disabled={isLoading}
          type="submit"
          className="flex w-full text-xl items-center justify-center gap-3 h-12 rounded-full"
        >
          {isLoading ? (
            <>
              Memuat
              <LoaderCircle className="h-8 w-6 animate-spin text-gray-500" />
            </>
          ) : pendingVerification ? (
            "Verify"
          ) : (
            "Sign Up"
          )}
        </Button>
        <div id="clerk-captcha" />
      </FieldGroup>
    </form>
  );
}
