import * as fs from "fs";
import * as path from "path";

export class PromptUtils {
  // Define rule file names relative to this file's directory
  private static readonly ruleFiles = [
    "./prompts/rules/role-clarity.prompt",
    "./prompts/rules/logical-conflicts.prompt",
    "./prompts/rules/io-examples.prompt",
    "./prompts/rules/instruction-complexity.prompt",
    "./prompts/rules/emphasis-overuse.prompt",
  ];

  /**
   * Strips prompt-linter comments from prompt content
   */
  static stripPromptLinterComments(content: string): string {
    // Remove all text between #prompt-linter ignore and #endignore
    return content
      .replace(/#prompt-linter\s+ignore[\s\S]*?#endignore\s*/g, "")
      .trim();
  }

  /**
   * Reads a prompt file using fs and optionally strips comments.
   * Resolves paths relative to the current file's directory (__dirname).
   */
  private static readPromptFile(
    filePath: string,
    stripPromptLinterCommentsFlag = true
  ): string {
    const absolutePath = path.resolve(__dirname, filePath);
    try {
      const content = fs.readFileSync(absolutePath, "utf8");
      return stripPromptLinterCommentsFlag
        ? this.stripPromptLinterComments(content)
        : content;
    } catch (error) {
      console.error(`Error reading prompt file: ${absolutePath}`, error);
      // Consider providing more context or re-throwing a custom error
      throw new Error(
        `Failed to read prompt file: ${absolutePath}. Ensure it exists and the extension has permissions.`
      );
    }
  }

  // Load rules content dynamically (stripped)
  private static get rulesContent(): string[] {
    return this.ruleFiles.map(
      (ruleFile) => this.readPromptFile(ruleFile, true) // Read and strip comments for rules
    );
  }

  /**
   * Loads the main prompt template file, injects rules, but does NOT strip the template's own comments.
   */
  static loadPromptTemplate(): string {
    // Load the raw template file content (relative to this file)
    const templatePath = `./prompts/analyze.prompt`;
    let template = this.readPromptFile(templatePath, false); // Read raw content

    // Inject rules if template contains {{RULES}}
    if (template.includes("{{RULES}}")) {
      const combinedRules = this.rulesContent.join("\n\n");
      template = template.replace("{{RULES}}", combinedRules);
    }

    return template; // Return the template with rules injected
  }
}
