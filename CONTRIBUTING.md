# Contributing to Prompt Linter

We love your input! We want to make contributing to Prompt Linter as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer
- Adding new prompt analysis rules

## Development Process
We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. Make sure your prompts lint
3. Issue that pull request!

## Any contributions you make will be under the MIT Software License
When you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/your-repo/prompt-linter/issues)
We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/your-repo/prompt-linter/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Adding New Rules
The prompt analysis engine is designed to be extensible. To add a new rule:

1. Create a new rule file in `src/prompts/rules/`
2. Follow the existing rule format
3. Create a test directory in `.prompt-linter-test-proj/rules/<your-rule-name>/`
4. Add test prompt files that:
   - Demonstrate correct usage
   - Show common mistakes
   - Cover edge cases
5. Update the rule documentation
6. Submit a PR with your changes

### Test Directory Structure
.prompt-linter-test-proj/
└── rules/
└── your-rule-name/
├── valid/
│ ├── good-example1.prompt
│ └── good-example2.prompt
└── invalid/
├── bad-example1.prompt
└── bad-example2.prompt

Each test prompt should include comments explaining what is being tested and why it should pass or fail.

## License
By contributing, you agree that your contributions will be licensed under its MIT License.

## References
This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/a9316a723f9e918afde44dea68b5f9f39b7d9b00/CONTRIBUTING.md).