import * as fs from 'fs';
import * as path from 'path';
import analyzePrompt from '../prompts/analyze.prompt';
import roleClarity from '../prompts/rules/role-clarity.prompt';
import logicalConflicts from '../prompts/rules/logical-conflicts.prompt';
import ioExamples from '../prompts/rules/io-examples.prompt';
import instructionComplexity from '../prompts/rules/instruction-complexity.prompt';
import emphasisOveruse from '../prompts/rules/emphasis-overuse.prompt';

export class PromptUtils {
    private static readonly rules = [
        roleClarity,
        logicalConflicts,
        ioExamples,
        instructionComplexity,
        emphasisOveruse
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
     * Loads and processes a prompt file, removing comments
     */
    static loadPromptFile(filePath: string): string {
        const content = fs.readFileSync(filePath, 'utf8');
        return this.stripComments(content);
    }

    /**
     * Loads and combines multiple prompt files from a directory
     */
    static loadPromptDirectory(dirPath: string, filePattern = '.prompt'): string {
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith(filePattern));

        return files
            .map(filename => {
                const filePath = path.join(dirPath, filename);
                return this.loadPromptFile(filePath);
            })
            .join('\n\n')
            .trim();
    }

    /**
     * Loads the main prompt template and injects rules
     */
    static loadPromptTemplate(templateName: string): string {
        let template = analyzePrompt;

        // Inject rules if template contains {{RULES}}
        if (template.includes('{{RULES}}')) {
            const rulesContent = this.rules
                .map(rule => this.stripComments(rule))
                .join('\n\n');
            template = template.replace('{{RULES}}', rulesContent);
        }

        return template;
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
        const normalizedPartial = partialText.replace(/\\n/g, '\n').trim();
        
        // Case insensitive search
        const searchText = normalizedPartial.toLowerCase();
        
        // First try exact match
        if (normalizedPrompt.toLowerCase().includes(searchText)) {
            // Find the start and end positions of the match
            const startIndex = normalizedPrompt.toLowerCase().indexOf(searchText);
            const endIndex = startIndex + searchText.length;
            
            // Extract the original text (preserving case)
            return normalizedPrompt.slice(startIndex, endIndex).trim();
        }

        // If no exact match, try line-by-line
        const lines = normalizedPrompt.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes(searchText)) {
                return line.trim();
            }
        }

        // If still no match, try word-based search
        const words = normalizedPrompt.split(/\s+/);
        const searchWords = searchText.split(/\s+/);
        
        for (let i = 0; i <= words.length - searchWords.length; i++) {
            const windowText = words.slice(i, i + searchWords.length + 2).join(' ').toLowerCase();
            if (windowText.includes(searchText)) {
                return words.slice(i, i + searchWords.length + 2).join(' ').trim();
            }
        }

        return normalizedPartial; // fallback to the original text if no match found
    }
} 