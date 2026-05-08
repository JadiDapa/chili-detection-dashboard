import Image from "next/image";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="">
      <div className="">
        <figure className="relative mx-auto size-24">
          <Image
            src={
              "https://upload.wikimedia.org/wikipedia/id/thumb/b/bc/Logo_Universitas_Sriwijaya.svg/2489px-Logo_Universitas_Sriwijaya.svg.png"
            }
            fill
            className="object-contain object-center"
            alt=""
          />
        </figure>
        <div className="text-primary flex items-center justify-center gap-4 text-center text-4xl font-semibold tracking-wide">
          <p>
            Greenhouse
            <br /> Teknik UNSRI
          </p>
        </div>
      </div>

      <p className="mx-auto mt-2 max-w-sm text-center text-sm">{subtitle}</p>
    </div>
  );
}
