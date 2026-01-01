import { createMetadata } from "@/lib/seo";
import ProjectClient from "./page.client";
import { getProjectFiles } from "@/lib/projects";

export const metadata = createMetadata({
  title: "Project",
  description: "우리들의 프로젝트를 공유합니다",
  path: "/project",
});

export default function Page() {
  const projects = getProjectFiles();
  return <ProjectClient initialProjects={projects} />;
}

