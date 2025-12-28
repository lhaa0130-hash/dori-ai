import { getProjectData, getProjectFiles } from '@/lib/projects';
import { notFound } from 'next/navigation';
import ProjectDetailClient from './page.client';
import { createMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const projects = getProjectFiles();
  return projects.map((project) => ({
    id: project.id,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const project = await getProjectData(id);
    return createMetadata({
      title: project.title || 'Project',
      description: project.description || '',
      path: `/project/${id}`,
    });
  } catch {
    return createMetadata({
      title: 'Project',
      description: '',
      path: `/project/${id}`,
    });
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  
  try {
    const project = await getProjectData(id);
    return <ProjectDetailClient project={project} />;
  } catch (error) {
    console.error('Project detail page error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return notFound();
  }
}


