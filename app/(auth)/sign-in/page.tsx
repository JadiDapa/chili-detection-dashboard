import AuthCarousel from "@/components/auth/AuthCarousel";
import SignInForm from "@/components/auth/sign-in/SignInForm";
import AuthHeader from "@/components/auth/AuthHeader";
import RedirectIfSignedIn from "@/components/auth/RedirectIfSignedIn";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) redirect("/");

  return (
    <section className="flex min-h-screen overflow-hidden">
      <RedirectIfSignedIn />
      <AuthCarousel />

      <main className="bg-card flex w-full flex-col items-center justify-center p-8 shadow-xl lg:w-[40%] lg:rounded-e-4xl lg:px-40">
        <AuthHeader
          title="Sign In Now!"
          subtitle="Sebelum melangkah lebih lanjut, silahkan masuk terlebih dahulu!"
        />
        <SignInForm />
        <p className="mt-4 text-center lg:mt-6">
          Belum memiliki akun?{" "}
          <Link className="text-primary underline" href="/sign-up">
            Daftar Sekarang!
          </Link>
        </p>
      </main>
    </section>
  );
}
