import { StudyFilterForm } from "@/components/study/StudyFilterForm";

export default function StudyPage() {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Study Mode</h1>
        <p className="text-muted-foreground mt-2">
          Latihan bebas dengan feedback instan
        </p>
      </div>
      <StudyFilterForm />
    </div>
  );
}
