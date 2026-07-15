import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  muted?: boolean;
  children: ReactNode;
};

export function FormSection({ title, description, muted = false, children }: FormSectionProps) {
  return (
    <Card className={cn(muted && "opacity-70")}>
      <FieldSet className="contents">
        <CardHeader className="border-b">
          <FieldLegend>
            <CardTitle>{title}</CardTitle>
          </FieldLegend>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">{children}</FieldGroup>
        </CardContent>
      </FieldSet>
    </Card>
  );
}
