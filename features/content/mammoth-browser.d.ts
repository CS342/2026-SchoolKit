// mammoth ships types for its main entry but not for the prebuilt browser bundle,
// which is the one that's safe to bundle for the web (no Node builtins). Declare the
// slice of the API we use.
declare module 'mammoth/mammoth.browser' {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
