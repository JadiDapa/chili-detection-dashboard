import AuthCarousel from "@/components/auth/AuthCarousel";
import AuthHeader from "@/components/auth/AuthHeader";
import Link from "next/link";
import SignUpForm from "@/components/auth/sign-up/SignUpForm";

export default function SignUpPage() {
  return (
    <section className="flex min-h-screen overflow-hidden ">
      <main className="bg-card flex w-full flex-col items-center justify-center p-8 shadow-2xl lg:w-[45%] lg:rounded-e-4xl lg:px-40">
        <AuthHeader
          title="Sign Up Now!"
          subtitle="Sebelum melangkah lebih lanjut, silahkan masuk terlebih dahulu!"
        />
        <SignUpForm />
        <p className="text-center ">
          Already have an account?{" "}
          <Link className="text-primary underline" href="/sign-in">
            Sign In!
          </Link>
        </p>
      </main>
      <AuthCarousel />
    </section>
  );
}
