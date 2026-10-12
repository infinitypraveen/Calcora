import { useEffect } from "react";
import { applySeo, type SeoInput } from "@/lib/seo";

export function Seo(props: SeoInput) {
  useEffect(() => {
    applySeo(props);
  }, [props.title, props.description, props.path, props.noindex, props.jsonLd]);
  return null;
}
