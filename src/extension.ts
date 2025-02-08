import * as vscode from 'vscode';
import { AiService, LintingIssue } from './aiService';

let diagnosticCollection: vscode.DiagnosticCollection;
let aiService: AiService;
let lastResponse: string | null = null;

export function activate(context: vscode.ExtensionContext) {
    // Create a diagnostic collection to store our linting results
    diagnosticCollection = vscode.languages.createDiagnosticCollection('prompt-linter');
    context.subscriptions.push(diagnosticCollection);

    aiService = new AiService();

    // Register command to show response
    let showResponseCommand = vscode.commands.registerCommand('promptLinter.showResponse', () => {
        if (lastResponse) {
            const panel = vscode.window.createWebviewPanel(
                'promptAnalysis',
                'Prompt Analysis Result',
                vscode.ViewColumn.Two,
                {}
            );
            
            const response = JSON.parse(lastResponse);
            const rawContent = JSON.stringify(response.issues, null, 2)
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
                    <div class="metadata-item">Model: ${response.metadata.model}</div>
                    <div class="metadata-item">Input Tokens: ${response.metadata.inputTokens}</div>
                    <div class="metadata-item">Output Tokens: ${response.metadata.outputTokens}</div>
                    <div class="metadata-item">Cost: ${response.metadata.cost}</div>
                    <div class="metadata-item">Time: ${new Date(response.metadata.timestamp).toLocaleString()}</div>
                </div>
                <div class="response">
                    Raw Response:
                    <pre class="content">${rawContent}</pre>
                </div>
            `;
        }
    });

    context.subscriptions.push(showResponseCommand);

    // Register a save event listener
    let disposable = vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
        if (document.uri.fsPath.endsWith('.prompt')) {
            await lintDocument(document);
        }
    });

    context.subscriptions.push(disposable);

    // Register file open event listener
    let openListener = vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
        if (document.uri.fsPath.endsWith('.prompt')) {
            await lintDocument(document);
        }
    });

    // Check any already open .prompt files
    vscode.workspace.textDocuments.forEach(async (document) => {
        if (document.uri.fsPath.endsWith('.prompt')) {
            await lintDocument(document);
        }
    });

    context.subscriptions.push(openListener);
}

async function lintDocument(document: vscode.TextDocument) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Analyzing prompt...",
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ message: "Sending to AI service" });
            const text = document.getText();
            const response = await aiService.analyzePrompt(text);
            
            progress.report({ message: "Processing response" });
            lastResponse = JSON.stringify(response, null, 2);

            const diagnostics = response.issues.flatMap(issue => {
                const diagnostics: vscode.Diagnostic[] = [];
                const fullText = document.getText();
                
                // Find all occurrences of the problematic text
                let searchIndex = 0;
                while (true) {
                    const startIndex = fullText.indexOf(issue.text, searchIndex);
                    if (startIndex === -1) break;
                    
                    const startPos = document.positionAt(startIndex);
                    const endPos = document.positionAt(startIndex + issue.text.length);
                    
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(startPos, endPos),
                        issue.message,
                        vscode.DiagnosticSeverity.Warning
                    ));
                    
                    searchIndex = startIndex + 1;
                }
                
                return diagnostics;
            });

            diagnosticCollection.set(document.uri, diagnostics);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            lastResponse = aiService.lastRawResponse;
            
            // Show error with "Show Response" button
            vscode.window.showErrorMessage(
                `Error linting prompt: ${message}`,
                "Show Response"
            ).then(selection => {
                if (selection === "Show Response") {
                    vscode.commands.executeCommand('promptLinter.showResponse');
                }
            });
            return;
        }

        // Show success notification
        vscode.window.showInformationMessage(
            "Prompt analysis complete", 
            "Show Response"
        ).then(selection => {
            if (selection === "Show Response") {
                vscode.commands.executeCommand('promptLinter.showResponse');
            }
        });
    });
}

export function deactivate() {} 