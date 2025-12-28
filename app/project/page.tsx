import { createMetadata } from "@/lib/seo";
import ProjectClient from "./page.client";
import { getProjectFiles } from "@/lib/projects";

export const metadata = createMetadata({
  title: "Project",
  description: "데이터와 인사이트로 더 나은 결정을 내리세요.",
  path: "/project",
});

export default function Page() {
  const projects = getProjectFiles();
  return <ProjectClient initialProjects={projects} />;
}

