import * as vscode from 'vscode';
import { AnthropicService } from './services/anthropicService';
import { WebPrompterService } from './services/webPrompterService';
import { AnalysisResponse } from './types';

export class AiService {
    private service: AnthropicService | WebPrompterService | null = null;
    public lastResponse = '';
    public lastRawResponse = '';

    constructor() {
        this.initializeService();
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('promptLinter')) {
                this.initializeService();
            }
        });
    }

    private initializeService(): void {
        const config = vscode.workspace.getConfiguration('promptLinter');
        const provider = config.get<string>('aiServiceProvider') || 'webprompter';

        try {
            if (provider === 'webprompter') {
                const apiKey = config.get<string>('webprompterApiKey');
                if (!apiKey) {
                    this.service = null;
                    void vscode.window.showWarningMessage('WebPrompter API key not configured. Please add it in settings.');
                    return;
                }
                this.service = new WebPrompterService(apiKey);
            } else {
                const apiKey = config.get<string>('anthropicApiKey');
                const model = config.get<string>('anthropicModel');
                if (!apiKey || !model) {
                    this.service = null;
                    void vscode.window.showWarningMessage('Anthropic configuration missing. Please check settings.');
                    return;
                }
                this.service = new AnthropicService(apiKey, model);
            }
        } catch (error) {
            this.service = null;
            void vscode.window.showErrorMessage(`Failed to initialize service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async analyzePrompt(text: string): Promise<AnalysisResponse> {
        if (!this.service) {
            throw new Error('Service not initialized. Please check your API configuration in settings.');
        }
        const response = await this.service.analyze(text);

        return response;
    }
} 