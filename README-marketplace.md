# Prompt Linter

![Prompt Linter Banner](images/banner.png)

AI-powered linter that helps you write better prompts by identifying logical conflicts, ambiguities, and areas for improvement.

## ✨ Features

### 🔍 Real-time Analysis
Get instant feedback on your prompts as you type:
- Logical conflicts and contradictions
- Role clarity and consistency
- Instruction complexity
- Missing examples and specifications
- Emphasis and formatting issues

### 🎯 Smart Issue Detection
```prompt
You are a helpful assistant who is very formal but also casual.
Please make the image bigger and smaller.
Generate a blue or maybe green logo.
```
↓ The linter identifies:
- Contradictory personality traits
- Conflicting size instructions
- Ambiguous color specifications

### 💰 Cost Tracking
Monitor your API usage with detailed token counting and cost estimation for each analysis.

## 🚀 Getting Started

1. Install the extension
2. Add your Anthropic API key in settings:
   ```json
   {
     "promptLinter.anthropicApiKey": "your-api-key"
   }
   ```
3. Create a .prompt file and start writing!

## 📋 Rule Categories

### 1. Role Clarity
Ensures consistent assistant behavior:
```prompt
❌ You are a senior developer but also act as a comedian.
✅ You are a senior developer who explains concepts clearly.
```

### 2. Logical Conflicts
Catches contradictory instructions:
```prompt
❌ Prioritize speed over accuracy, but ensure 100% accuracy.
✅ Prioritize speed while maintaining 95% accuracy.
```

### 3. Input/Output Examples
Verifies clear specifications:
```prompt
❌ Convert the input to the proper format.
✅ Convert dates to ISO 8601 format, e.g., "2024-03-20T15:30:00Z"
```

### 4. Instruction Complexity
Monitors for overly complex requirements:
```prompt
❌ Analyze performance, security, maintainability, and...
✅ Focus on identifying security vulnerabilities first.
```

### 5. Emphasis Overuse
Checks for effective emphasis:
```prompt
❌ **IMPORTANT!!!** This is **CRITICAL** and **URGENT**!!!
✅ Important: This requires immediate attention.
```

## ⚙️ Configuration

* `promptLinter.aiServiceProvider`: Select AI service (Anthropic)
* `promptLinter.anthropicApiKey`: Your Anthropic API key
* `promptLinter.anthropicModel`: Choose Claude model
* `promptLinter.filePatterns`: File patterns to analyze

## 📝 Requirements

- VS Code 1.80.0 or higher
- Anthropic API key

## 🆕 Release Notes

### 0.1.0
- Initial release
- Support for Claude 3 Sonnet
- 5 rule categories with examples
- Cost tracking
- File pattern matching

## 🤝 Contributing

Found a bug or have a suggestion? Please open an issue on our [GitHub repository](https://github.com/your-username/prompt-linter). 