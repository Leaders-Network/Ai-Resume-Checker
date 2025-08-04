declare module 'textrank' {
  const textrank: {
    summarize: (text: string, n?: number) => string[];
  };
  export default textrank;
}
