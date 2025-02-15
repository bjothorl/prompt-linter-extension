import { Anthropic as AnthropicClient } from '@anthropic-ai/sdk';
import { AiService, AnalysisResponse } from '../types';
import modelCosts from '../config/model-costs.json';
import { PromptUtils } from '../utils/promptUtils';

export class AnthropicService implements AiService {
    private client: AnthropicClient;
    private promptTemplate: string;
    private model: string;
    public lastResponse = '';

    constructor(apiKey: string, model: string) {
        this.client = new AnthropicClient({ apiKey });
        this.model = model;
        this.promptTemplate = PromptUtils.loadPromptTemplate('analyze.prompt');
    }

    private getModelCosts(model: string): { input: number; output: number } {
        const costs = modelCosts[model as keyof typeof modelCosts];
        if (!costs) {
            throw new Error(`Invalid model: ${model}. Please select a valid model in settings.`);
        }
        return { input: costs.input, output: costs.output };
    }

    async analyze(text: string): Promise<AnalysisResponse> {
        const prompt = this.promptTemplate.replace('{{PROMPT_TEXT}}', text);

        const system = prompt.match(/<PROMPT_LINTER_SYSTEM_PROMPT>([\s\S]*?)<\/PROMPT_LINTER_SYSTEM_PROMPT>/)?.[1];
        const user = prompt.match(/<PROMPT_LINTER_USER_PROMPT>([\s\S]*?)<\/PROMPT_LINTER_USER_PROMPT>/)?.[1];

        if (!system || !user) {
            throw new Error('The analysis prompt (src/prompts/analyze.prompt) must have a <PROMPT_LINTER_SYSTEM_PROMPT> and <PROMPT_LINTER_USER_PROMPT> section.');
        }

        console.log(system);

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: system,
            messages: [{ role: 'user', content: user }]
        });

        const content = response.content[0].text;

        this.lastResponse = content;

        console.log(content);

        // Check for no issues first
        if (content.includes('<no-issues>')) {
            return {
                metadata: this.createMetadata(response),
                issues: [],
                rawResponse: content
            };
        }

        // Parse issues with the new XML format
        const issuesMatch = content.match(/<issues>([\s\S]*?)<\/issues>/);
        if (!issuesMatch) {
            throw new Error('Invalid response format: missing <issues> tag');
        }

        const issues = Array.from<RegExpMatchArray>(issuesMatch[1].matchAll(
            /<issue type="(exact|range)">\s*(?:(?:<text>([\s\S]*?)<\/text>)|(?:<start>([\s\S]*?)<\/start>\s*<end>([\s\S]*?)<\/end>))\s*<message>([\s\S]*?)<\/message>\s*(?:<rule>([\s\S]*?)<\/rule>)?\s*<\/issue>/gs
        )).map(match => {
            const type = match[1];
            if (type === 'exact') {
                return {
                    start: match[2].trim(),
                    end: match[2].trim(),
                    message: match[5].trim(),
                    rule: match[6]?.trim() || ''
                };
            } else {
                return {
                    start: match[3].trim(),
                    end: match[4].trim(),
                    message: match[5].trim(),
                    rule: match[6]?.trim() || ''
                };
            }
        });

        return {
            metadata: this.createMetadata(response),
            issues,
            rawResponse: content
        };
    }

    private createMetadata(response: any) {
        const modelCosts = this.getModelCosts(this.model);
        const inputCost = (response.usage.input_tokens * modelCosts.input / 1000000);
        const outputCost = (response.usage.output_tokens * modelCosts.output / 1000000);
        const totalCost = (inputCost + outputCost).toFixed(6);

        return {
            model: this.model,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cost: `$${totalCost} (Input: $${inputCost.toFixed(6)}, Output: $${outputCost.toFixed(6)})`,
            timestamp: new Date().toISOString()
        };
    }
} 