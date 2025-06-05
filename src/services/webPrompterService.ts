import axios from "axios";
import { AnalysisResponse, AiService } from "../types";

export class WebPrompterService implements AiService {
  private readonly API_URL = "http://localhost:3000/api/v1/analyze";
  public lastResponse = "";

  constructor(private apiKey: string) {}

  async analyze(text: string): Promise<AnalysisResponse> {
    try {
      const { data } = await axios.post(
        this.API_URL,
        { prompt: text },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
          },
        }
      );

      this.lastResponse = data.analysis;

      // Parse issues with the new XML format
      const issuesMatch = data.analysis.match(/<issues>([\s\S]*?)<\/issues>/);
      if (!issuesMatch) {
        throw new Error("Invalid response format: missing <issues> tag");
      }

      const issues = Array.from<RegExpMatchArray>(
        issuesMatch[1].matchAll(
          /<issue type="(exact|range)">\s*(?:(?:<text>([\s\S]*?)<\/text>)|(?:<start>([\s\S]*?)<\/start>\s*<end>([\s\S]*?)<\/end>))\s*<message>([\s\S]*?)<\/message>\s*(?:<rule>([\s\S]*?)<\/rule>)?\s*<\/issue>/gs
        )
      ).map((match) => {
        const type = match[1];
        if (type === "exact") {
          return {
            start: match[2].trim(),
            end: match[2].trim(),
            message: match[5].trim(),
            rule: match[6]?.trim() || "",
          };
        } else {
          return {
            start: match[3].trim(),
            end: match[4].trim(),
            message: match[5].trim(),
            rule: match[6]?.trim() || "",
          };
        }
      });

      return {
        issues,
        rawResponse: data.analysis,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }
}
