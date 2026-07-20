// 회원가입은 한글판과 동일하게 로그인 페이지의 가입 탭으로 통일돼 있다.
// 영어 사용자는 영어 로그인 화면의 가입 탭으로 보낸다.
import { redirect } from "next/navigation";

export default function EnSignupPage() {
  redirect("/en/login?tab=signup");
}
