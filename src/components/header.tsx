import Image from "next/image";
import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <div className="w-full fixed top-0 left-0 flex flex-row h-24">
      <Image
        className="absolute left-8 top-1/2 -translate-y-1/2"
        src="wad_logo.svg"
        alt=""
        width={60}
        height={20}
      />

      <h1 className="absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2 text-4xl font-normal">
        Vault Demo
      </h1>

      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <WalletButton />
      </div>
    </div>
  );
}
