import Anthropic from '@anthropic-ai/sdk';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import modelCosts from './config/model-costs.json';

export interface LintingIssue {
    text: string;      // The problematic text to find
    message: string;   // The error message
}

export interface AnalysisMetadata {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: string;
    timestamp: string;
}

export interface AnalysisResponse {
    metadata: AnalysisMetadata;
    issues: LintingIssue[];
}

export class AiService {
    private client: Anthropic | null = null;
    private promptTemplate: string;
    private model: string;
    public lastRawResponse: string = '';

    constructor() {
        this.initializeClient();
        // Read the prompt template
        const templatePath = path.join(__dirname, '..', 'src', 'prompts', 'analyze.prompt');
        this.promptTemplate = fs.readFileSync(templatePath, 'utf8');
        
        // Get model from config
        const config = vscode.workspace.getConfiguration('promptLinter');
        const model = config.get<string>('model');
        if (!model) {
            throw new Error('Model not configured. Please select a model in settings.');
        }
        this.model = model;
    }

    private initializeClient() {
        const config = vscode.workspace.getConfiguration('promptLinter');
        const apiKey = config.get<string>('anthropicApiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage('Anthropic API key not configured. Please add it in settings.');
            return;
        }

        this.client = new Anthropic({
            apiKey: apiKey
        });
    }

    private getModelCosts(model: string): { input: number; output: number } {
        const costs = modelCosts[model as keyof typeof modelCosts];
        if (!costs) {
            throw new Error(`Invalid model: ${model}. Please select a valid model in settings.`);
        }
        return { input: costs.input, output: costs.output };
    }

    async analyzePrompt(text: string): Promise<AnalysisResponse> {
        if (!this.client) {
            throw new Error('AI client not initialized');
        }

        try {
            const prompt = this.promptTemplate.replace('{{PROMPT_TEXT}}', text);
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1024,
                system: 'You are a microservice that analyzes prompts for inconsistencies.',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text;
            this.lastRawResponse = content;
            const result = JSON.parse(content);

            const modelCosts = this.getModelCosts(this.model);
            const inputCost = (response.usage.input_tokens * modelCosts.input / 1000000);
            const outputCost = (response.usage.output_tokens * modelCosts.output / 1000000);
            const totalCost = (inputCost + outputCost).toFixed(6);

            return {
                metadata: {
                    model: this.model,
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens,
                    cost: `$${totalCost} (Input: $${inputCost.toFixed(6)}, Output: $${outputCost.toFixed(6)})`,
                    timestamp: new Date().toISOString()
                },
                issues: result.issues
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Error analyzing prompt:', errorMessage);
            throw new Error(`Failed to analyze prompt: ${errorMessage}`);
        }
    }
} 