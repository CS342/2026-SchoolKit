// mammoth ships types for its main entry but not for the prebuilt browser bundle,
// which is the one that's safe to bundle for the web (no Node builtins). Declare the
// slice of the API we use.
declare module 'mammoth/mammoth.browser' {
  type Result = { value: string; messages: unknown[] };
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<Result>;
  export function convertToMarkdown(input: { arrayBuffer: ArrayBuffer }): Promise<Result>;
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<Result>;
  const mammoth: { extractRawText: typeof extractRawText; convertToMarkdown: typeof convertToMarkdown; convertToHtml: typeof convertToHtml };
  export default mammoth;
}
