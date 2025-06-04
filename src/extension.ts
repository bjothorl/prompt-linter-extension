import * as vscode from "vscode";
import { AiService } from "./aiService";
import * as path from "path";
import { Minimatch } from "minimatch";
import { PromptUtils } from "./promptUtils";

let diagnosticCollection: vscode.DiagnosticCollection;
let aiService: AiService;
let lastResponse: string | null = null;
let lastRawResponse: string | null = null;

function shouldAnalyzeFile(document: vscode.TextDocument): boolean {
  const config = vscode.workspace.getConfiguration("promptLinter");
  const patterns = config.get<string[]>("filePatterns") || ["**/*.prompt"];

  // Convert document path to workspace-relative path
  const workspacePath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
    .fsPath;
  if (!workspacePath) {
    return false;
  }

  const relativePath = path.relative(workspacePath, document.uri.fsPath);

  // Check if file matches any pattern
  return patterns.some((pattern) => new Minimatch(pattern).match(relativePath));
}

export function activate(context: vscode.ExtensionContext): void {
  // Create a diagnostic collection to store our linting results
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("prompt-linter");
  context.subscriptions.push(diagnosticCollection);

  aiService = new AiService();

  // Register command to show response
  const showResponseCommand = vscode.commands.registerCommand(
    "promptLinter.showResponse",
    () => {
      if (lastResponse && lastRawResponse) {
        const panel = vscode.window.createWebviewPanel(
          "promptAnalysis",
          "Prompt Analysis Result",
          vscode.ViewColumn.Two,
          {}
        );

        const response = JSON.parse(lastResponse) as {
          metadata: {
            model: string;
            inputTokens: number;
            outputTokens: number;
            cost: string;
            timestamp: string;
          };
          issues: Array<{ text: string; message: string }>;
        };

        const rawContent = lastRawResponse
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        panel.webview.html = `
                <style>
                    .metadata {
                        border: 1px solid #aaaaaa;
                        padding: 10px;
                        margin-bottom: 20px;
                        border-radius: 4px;
                        font-family: monospace;
                    }
                    .metadata-item {
                        margin: 5px 0;
                    }
                    .content {
                        padding: 20px;
                        white-space: pre-wrap;
                    }
                    .response {
                        font-family: monospace;
                        padding: 10px;
                        border: 1px solid #aaaaaa;
                    }
                </style>
                <div class="metadata">
                    <div class="metadata-item">Model: ${
                      response.metadata.model
                    }</div>
                    <div class="metadata-item">Input Tokens: ${
                      response.metadata.inputTokens
                    }</div>
                    <div class="metadata-item">Output Tokens: ${
                      response.metadata.outputTokens
                    }</div>
                    <div class="metadata-item">Cost: ${
                      response.metadata.cost
                    }</div>
                    <div class="metadata-item">Time: ${new Date(
                      response.metadata.timestamp
                    ).toLocaleString()}</div>
                </div>
                <div class="response">
                    Raw Response:
                    <pre class="content">${rawContent}</pre>
                </div>
            `;
      }
    }
  );

  context.subscriptions.push(showResponseCommand);

  // Register a save event listener
  const disposable = vscode.workspace.onDidSaveTextDocument(
    async (document: vscode.TextDocument) => {
      if (shouldAnalyzeFile(document)) {
        await lintDocument(document);
      }
    }
  );

  context.subscriptions.push(disposable);

  // Register file open event listener
  const openListener = vscode.workspace.onDidOpenTextDocument(
    async (document: vscode.TextDocument) => {
      if (shouldAnalyzeFile(document)) {
        await lintDocument(document);
      }
    }
  );

  // Check any already open matching files
  void Promise.all(
    vscode.workspace.textDocuments.map(async (document) => {
      if (shouldAnalyzeFile(document)) {
        await lintDocument(document);
      }
    })
  );

  context.subscriptions.push(openListener);
}

async function lintDocument(document: vscode.TextDocument): Promise<void> {
  const progressNotification = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Analyzing prompt...",
      cancellable: false,
    },
    async (progress) => {
      try {
        progress.report({ message: "Sending to AI service" });
        // Strip comments before sending to any AI service
        const text = PromptUtils.stripPromptLinterComments(document.getText());
        const response = await aiService.analyzePrompt(text);

        lastResponse = JSON.stringify(response, null, 2);
        lastRawResponse = response.rawResponse;

        const diagnostics = response.issues.map((issue) =>
          createDiagnostic(issue, document)
        );

        diagnosticCollection.set(document.uri, diagnostics);
        return { success: true };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        lastResponse = aiService.lastRawResponse;
        return { success: false, error: message };
      }
    }
  );

  // Show appropriate notification after progress is done
  if (progressNotification.success) {
    void vscode.window
      .showInformationMessage("Prompt analysis complete", "Show Response")
      .then((selection) => {
        if (selection === "Show Response") {
          void vscode.commands.executeCommand("promptLinter.showResponse");
        }
      });
  } else {
    void vscode.window
      .showErrorMessage(
        `Error linting prompt: ${progressNotification.error}`,
        "Show Response"
      )
      .then((selection) => {
        if (selection === "Show Response") {
          void vscode.commands.executeCommand("promptLinter.showResponse");
        }
      });
  }
}

function createDiagnostic(
  issue: any,
  document: vscode.TextDocument
): vscode.Diagnostic {
  const text = document.getText();

  // Find all occurrences of start and end text
  const startPositions: number[] = [];
  let pos = 0;
  while ((pos = text.indexOf(issue.start, pos)) !== -1) {
    startPositions.push(pos);
    pos += 1;
  }

  // Find the start/end pair with smallest span
  let bestStartPos = -1;
  let bestEndPos = -1;
  let shortestSpan = Number.MAX_VALUE;

  for (const startPos of startPositions) {
    const endPos = text.indexOf(issue.end, startPos);
    if (endPos !== -1) {
      const span = endPos - startPos;
      if (span < shortestSpan) {
        shortestSpan = span;
        bestStartPos = startPos;
        bestEndPos = endPos;
      }
    }
  }

  const range =
    bestStartPos >= 0 && bestEndPos >= 0
      ? new vscode.Range(
          document.positionAt(bestStartPos),
          document.positionAt(bestEndPos + issue.end.length)
        )
      : new vscode.Range(0, 0, 0, 0);

  const diagnostic = new vscode.Diagnostic(
    range,
    `${issue.rule ? `[${issue.rule}]\n` : ""}${issue.message}`,
    vscode.DiagnosticSeverity.Warning
  );

  diagnostic.source = "Prompt Linter";
  diagnostic.code = issue.rule;

  return diagnostic;
}

export function deactivate(): void {}
