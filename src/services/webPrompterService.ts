import axios from 'axios';
import { AnalysisResponse, AiService } from '../types';

export class WebPrompterService implements AiService {
    private readonly API_URL = 'https://webprompter.ai/api/analyze';
    public lastResponse = '';
    
    constructor(private apiKey: string) {}

    async analyze(text: string): Promise<AnalysisResponse> {
        try {
            const { data } = await axios.post(
                this.API_URL,
                { prompt: text },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.apiKey
                    }
                }
            );

            this.lastResponse = data.rawResponse;

            return {
                metadata: {
                    cost: `$${data.usage.credits_spent.toFixed(6)}`,
                    timestamp: new Date().toISOString()
                },
                issues: data.analysis.issues,
                rawResponse: data.rawResponse
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
} 