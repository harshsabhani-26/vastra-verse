import { getBackgrounds } from "./actions";
import { HeroFooterBgClient } from "@/components/admin/HeroFooterBgClient";

export default async function HeroFooterBgPage() {
    const { heroBg, footerBg, logo, footerLogo } = await getBackgrounds();

    return (
        <HeroFooterBgClient heroBg={heroBg} footerBg={footerBg} logo={logo} footerLogo={footerLogo} />
    );
}
