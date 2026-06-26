import Image from "next/image";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="">
      <div className="">
        <div className="mx-auto flex items-center justify-center gap-4">
          <figure className="relative size-28">
            <Image
              src={"/logo.png"}
              fill
              className="object-contain object-center"
              alt=""
            />
          </figure>
          <figure className="relative size-24">
            <Image
              src={"/hme-logo.png"}
              fill
              className="object-contain object-center"
              alt=""
            />
          </figure>
        </div>
        <div className="text-center">
          <h1 className="text-primary text-4xl font-medium tracking-wide">
            Smart Greenhouse
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-semibold text-purple-700">
              Teknik Elektro
            </p>
            <p className="text-2xl font-bold tracking-widest text-yellow-400">
              UNSRI
            </p>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-2 max-w-sm text-center text-sm">{subtitle}</p>
    </div>
  );
}
