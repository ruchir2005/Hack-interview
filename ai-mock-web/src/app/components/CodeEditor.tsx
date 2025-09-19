"use client";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  initialCode: string;
  onCodeChange: (code: string) => void;
  language: string;
}

export default function CodeEditor({ initialCode, onCodeChange, language }: CodeEditorProps) {
  return (
    <Editor
      height="500px"
      defaultLanguage={language}
      defaultValue={initialCode}
      theme="vs-dark"
      onChange={(value) => onCodeChange(value || "")}
      options={{
        minimap: { enabled: false },
        readOnly: false,
      }}
    />
  );
}