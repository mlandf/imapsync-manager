import { JobEdit } from "@/components/jobs/job-edit";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobEdit jobId={Number(id)} />;
}
