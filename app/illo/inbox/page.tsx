import InboxClient from "./page.client";

export const metadata = {
  title: "illo 봇 알림함",
  description: "illo 봇이 보내는 알림·메시지·사이트 소식",
};

export default function InboxPage() {
  return <InboxClient />;
}
