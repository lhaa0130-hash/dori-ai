// app/signup/page.tsx
// 회원가입은 /login 페이지의 회원가입 탭으로 통일되었습니다.
// 기존 /signup 페이지는 작동하지 않는 별도 폼이었으므로 /login으로 리다이렉트합니다.
import { redirect } from "next/navigation";

export default function SignupPage() {
    redirect("/login?tab=signup");
}
