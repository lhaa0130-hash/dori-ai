import { createMetadata } from "@/lib/seo";
import NoticeClient from "./page.client";

export const metadata = createMetadata({
    title: "공지사항",
    description: "DORI-AI의 최신 소식과 업데이트를 확인하세요.",
    path: "/notice",
});

export default function NoticePage() {
    return <NoticeClient />;
}
