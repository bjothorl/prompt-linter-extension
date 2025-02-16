/**
 * Type definition for .prompt files
 * Using `export =` instead of `export default` for better CommonJS compatibility
 * when TypeScript compiles the code
 */
declare module '*.prompt' {
    const content: string;
    export = content;
} 