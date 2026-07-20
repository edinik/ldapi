"use client";

import { useRef, useState, useTransition } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { fetchAiGenerationModels, saveAiGenerationSettings } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  reasoningEffortLevels,
  type ReasoningEffortLevel,
} from "@/lib/site-model-capabilities";

type AiGenerationSettingsFormProps = {
  initialBaseUrl: string;
  initialModel: string;
  initialReasoningEffort: ReasoningEffortLevel | null;
  hasConfiguredApiKey: boolean;
};

const defaultReasoningEffort = "default";

export default function AiGenerationSettingsForm({
  initialBaseUrl,
  initialModel,
  initialReasoningEffort,
  hasConfiguredApiKey,
}: AiGenerationSettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [model, setModel] = useState(initialModel);
  const [models, setModels] = useState<string[]>([]);
  const [modelListLoaded, setModelListLoaded] = useState(false);
  const [modelListError, setModelListError] = useState<string | null>(null);
  const [reasoningEffort, setReasoningEffort] = useState<string>(
    initialReasoningEffort ?? defaultReasoningEffort,
  );
  const [loadingModels, startLoadingModels] = useTransition();
  const reasoningEffortLabel =
    reasoningEffort === defaultReasoningEffort
      ? "默认（不发送 reasoning_effort）"
      : reasoningEffort;

  function loadModels() {
    const form = formRef.current;
    if (!form) return;

    setModelListError(null);
    startLoadingModels(async () => {
      try {
        const result = await fetchAiGenerationModels(new FormData(form));
        if (!result.ok) {
          setModelListError(result.error);
          return;
        }

        setModels(result.models);
        setModelListLoaded(true);
      } catch {
        setModelListError("模型列表拉取失败，请稍后重试");
      }
    });
  }

  return (
    <form ref={formRef} action={saveAiGenerationSettings} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="aiBaseUrl">Base URL</FieldLabel>
        <Input
          id="aiBaseUrl"
          name="baseUrl"
          type="url"
          defaultValue={initialBaseUrl}
          placeholder="https://api.openai.com/v1"
        />
        <FieldDescription>留空时使用默认 OpenAI 地址或环境变量。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="aiModel">模型</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Combobox<string>
            items={models}
            inputValue={model}
            itemToStringLabel={(item) => item}
            onInputValueChange={(next, { reason }) => {
              if (reason !== "item-press") setModel(next);
            }}
            onValueChange={(next) => {
              if (next) setModel(next);
            }}
          >
            <ComboboxInput
              id="aiModel"
              placeholder="gpt-4.1-mini"
              autoComplete="off"
              className="flex-1"
            />
            <ComboboxContent>
              <ComboboxEmpty>
                {modelListLoaded ? "没有匹配模型，可继续使用当前自定义名称。" : "请先拉取模型。"}
              </ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Button type="button" variant="outline" disabled={loadingModels} onClick={loadModels}>
            {loadingModels ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {loadingModels ? "正在拉取..." : "拉取模型"}
          </Button>
        </div>
        <input type="hidden" name="model" value={model} />
        {modelListError ? (
          <p role="alert" className="text-sm text-destructive">
            {modelListError}
          </p>
        ) : modelListLoaded ? (
          <FieldDescription role="status">
            {models.length > 0
              ? `已拉取 ${models.length} 个模型，也可以继续输入自定义名称。`
              : "服务未返回可用模型，可继续手工输入。"}
          </FieldDescription>
        ) : (
          <FieldDescription>使用当前 Base URL 和 API Key 拉取；不支持枚举时仍可手工输入。</FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="aiReasoningEffort">推理强度</FieldLabel>
        <Select
          value={reasoningEffort}
          onValueChange={(next) => setReasoningEffort(next ?? defaultReasoningEffort)}
        >
          <SelectTrigger id="aiReasoningEffort" className="w-full">
            <SelectValue>{reasoningEffortLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={defaultReasoningEffort}>默认（不发送 reasoning_effort）</SelectItem>
            {reasoningEffortLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          name="reasoningEffort"
          value={reasoningEffort === defaultReasoningEffort ? "" : reasoningEffort}
        />
        <FieldDescription>部分兼容服务不支持此参数；生成失败时可切回默认。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="aiApiKey">API Key</FieldLabel>
        <Input
          id="aiApiKey"
          name="apiKey"
          type="password"
          autoComplete="new-password"
          placeholder={hasConfiguredApiKey ? "留空则保留当前密钥" : "请输入 API Key"}
        />
        <FieldDescription>出于安全考虑，已保存的密钥不会明文显示。</FieldDescription>
      </Field>

      <Button type="submit">保存 AI 配置</Button>
    </form>
  );
}
