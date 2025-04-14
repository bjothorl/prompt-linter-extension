import * as fs from 'fs';
import * as path from 'path';

export class PromptUtils {
    // Define rule file names relative to this file's directory
    private static readonly ruleFiles = [
        '../prompts/rules/role-clarity.prompt',
        '../prompts/rules/logical-conflicts.prompt',
        '../prompts/rules/io-examples.prompt',
        '../prompts/rules/instruction-complexity.prompt',
        '../prompts/rules/emphasis-overuse.prompt'
    ];

    /**
     * Strips prompt-linter comments from prompt content
     */
    static stripComments(content: string): string {
        // Remove all text between #prompt-linter ignore and #endignore
        return content
            .replace(/#prompt-linter\s+ignore[\s\S]*?#endignore\s*/g, '')
            .trim();
    }

    /**
     * Reads a prompt file using fs and optionally strips comments.
     * Resolves paths relative to the current file's directory (__dirname).
     */
    private static readPromptFile(filePath: string, stripCommentsFlag = true): string {
        const absolutePath = path.resolve(__dirname, filePath);
        try {
            const content = fs.readFileSync(absolutePath, 'utf8');
            return stripCommentsFlag ? this.stripComments(content) : content;
        } catch (error) {
            console.error(`Error reading prompt file: ${absolutePath}`, error);
            // Consider providing more context or re-throwing a custom error
            throw new Error(`Failed to read prompt file: ${absolutePath}. Ensure it exists and the extension has permissions.`);
        }
    }

    // Load rules content dynamically (stripped)
    private static get rulesContent(): string[] {
        return this.ruleFiles.map(ruleFile =>
            this.readPromptFile(ruleFile, true) // Read and strip comments for rules
        );
    }

    /**
     * Loads and processes a prompt file, removing comments.
     * Assumes filePath is relative to the location of this utils file.
     * Use with caution if called from outside this class with different relative paths.
     */
    static loadPromptFile(filePath: string): string {
         return this.readPromptFile(filePath, true); // Read and strip comments
    }


    /**
     * Loads and combines multiple prompt files from a directory.
     * Assumes dirPath is an absolute path or relative to the process CWD.
     */
    static loadPromptDirectory(dirPath: string, filePattern = '.prompt'): string {
        let files: string[];
        try {
            files = fs.readdirSync(dirPath)
                .filter(file => file.endsWith(filePattern));
        } catch (error) {
            console.error(`Error reading prompt directory: ${dirPath}`, error);
            throw new Error(`Failed to read prompt directory: ${dirPath}`);
        }

        return files
            .map(filename => {
                const absoluteFilePath = path.join(dirPath, filename);
                // Read the file content directly using fs, then strip comments
                try {
                    const content = fs.readFileSync(absoluteFilePath, 'utf8');
                    return this.stripComments(content);
                } catch (error) {
                    console.error(`Error reading prompt file from directory: ${absoluteFilePath}`, error);
                    // Continue processing other files? Or throw? Throwing seems safer.
                    throw new Error(`Failed to read prompt file: ${absoluteFilePath}`);
                }
            })
            .join('\n\n')
            .trim();
    }


    /**
     * Loads the main prompt template file, injects rules, but does NOT strip the template's own comments.
     */
    static loadPromptTemplate(templateName: string): string {
        // Load the raw template file content (relative to this file)
        const templatePath = `../prompts/${templateName}`;
        let template = this.readPromptFile(templatePath, false); // Read raw content

        // Inject rules if template contains {{RULES}}
        if (template.includes('{{RULES}}')) {
            const combinedRules = this.rulesContent.join('\n\n');
            template = template.replace('{{RULES}}', combinedRules);
        }

        return template; // Return the template with rules injected
    }

    /**
     * Finds the full line or context where a partial text appears in the prompt
     * @param fullPrompt The complete prompt text to search in
     * @param partialText The text snippet to find (may contain escaped newlines)
     * @returns The matched text from the original prompt, or the normalized partial text if no match found
     */
    static findTextInPrompt(fullPrompt: string, partialText: string): string {
        // Normalize newlines and whitespace in both texts
        const normalizedPrompt = fullPrompt.replace(/\r\n/g, '\n');
        // Normalize potential escaped newlines from AI response and trim
        const normalizedPartial = partialText.replace(/\\n/g, '\n').trim();

        // If the normalized partial text is empty, return it directly
        if (!normalizedPartial) {
            return normalizedPartial;
        }

        // Case insensitive search
        const lowerCasePrompt = normalizedPrompt.toLowerCase();
        const lowerCaseSearchText = normalizedPartial.toLowerCase();

        // First try exact match (case-insensitive)
        let startIndex = lowerCasePrompt.indexOf(lowerCaseSearchText);
        if (startIndex !== -1) {
            const endIndex = startIndex + lowerCaseSearchText.length;
            // Extract the original text (preserving case and original whitespace as much as possible)
            // Trim the result to match the likely AI output format which often trims.
            return normalizedPrompt.slice(startIndex, endIndex).trim();
        }

        // If no exact match, try line-by-line containment (case-insensitive)
        const lines = normalizedPrompt.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes(lowerCaseSearchText)) {
                // Return the original line, trimmed
                return line.trim();
            }
        }

        // If still no match, try word-based search (more fuzzy)
        // This part might be less reliable and could be removed if exact/line matches are sufficient
        const words = normalizedPrompt.split(/\s+/);
        const searchWords = normalizedPartial.split(/\s+/).filter(w => w.length > 0); // Filter empty strings

        if (searchWords.length === 0) {
             return normalizedPartial; // Fallback if search text becomes empty after split
        }

        for (let i = 0; i <= words.length - searchWords.length; i++) {
            // Create a window of original words
            const windowWords = words.slice(i, i + searchWords.length);
            // Compare lowercased, joined strings
            if (windowWords.join(' ').toLowerCase().includes(lowerCaseSearchText)) {
                 // Return the matched segment from original words, joined and trimmed
                 return windowWords.join(' ').trim();
            }
            // Check slightly larger window for partial matches within words? Maybe too complex.
        }

        // Fallback: return the normalized partial text if no match found in the prompt
        // This happens if the AI hallucinates text not present in the original.
        return normalizedPartial;
    }
} 