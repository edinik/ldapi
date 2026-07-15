import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FormSubmitBarProps = {
  saving: boolean;
  idleLabel: string;
  savingLabel?: string;
};

export function FormSubmitBar({ saving, idleLabel, savingLabel = "保存中..." }: FormSubmitBarProps) {
  return (
    <Card className="sticky bottom-4 z-10 bg-card/90 shadow-sm backdrop-blur">
      <CardContent className="p-3">
        <Button type="submit" disabled={saving} className="w-full" size="lg">
          {saving ? savingLabel : idleLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
