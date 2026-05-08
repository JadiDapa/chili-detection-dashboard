import AuthCarousel from "@/components/auth/AuthCarousel";
import AuthHeader from "@/components/auth/AuthHeader";
import Link from "next/link";
import SignUpForm from "@/components/auth/sign-up/SignUpForm";

export default function SignUpPage() {
  return (
    <section className="flex min-h-screen overflow-hidden ">
      <main className="flex flex-col w-[45%] items-center justify-center bg-card  lg:px-40 rounded-e-4xl shadow-2xl">
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
