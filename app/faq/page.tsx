import { createMetadata } from "@/lib/seo";
import FAQClient from "./page.client";

export const metadata = createMetadata({
    title: "FAQ",
    description: "자주 묻는 질문과 답변을 확인하세요.",
    path: "/faq",
});

export default function FAQPage() {
    return <FAQClient />;
}
