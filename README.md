## Rules

The linter checks for several categories of issues:

1. Role Clarity
   - Inconsistent assistant roles (e.g., "formal but casual")
   - Mixed expertise domains
   - Conflicting personality traits
   - Unclear primary function
   Example:
   ```prompt
   You are a senior software architect who will review code.
   Also act as a creative writer to make the code review more entertaining.
   Sometimes you should be a comedian and add jokes to lighten the mood.
   ```

2. Logical Conflicts
   - Contradictory instructions
   - Mutually exclusive requirements
   - Impossible conditions
   Example:
   ```prompt
   Prioritize speed over accuracy, but ensure 100% accuracy at all times.
   Be formal and professional, but also casual and friendly.
   ```

3. Input/Output Examples
   - Missing concrete examples
   - Unclear format requirements
   - Missing edge cases
   Example:
   ```prompt
   Please convert the input into the proper academic format.
   Make sure it follows standard guidelines.
   Include all necessary information in the output.
   ```

4. Instruction Complexity
   - Too many nested conditions
   - Overwhelming number of rules
   - Complex interdependencies
   Example:
   ```prompt
   You must analyze code while considering performance implications including 
   algorithmic complexity, memory usage patterns, CPU cache utilization, and 
   potential threading issues, then evaluate the code's maintainability...
   ```

5. Emphasis Overuse
   - Excessive use of emphasis markers
   - Diminished impact due to overuse
   - Unclear priority hierarchy
   Example:
   ```prompt
   **IMPORTANT!!!** You **MUST** review this code **CAREFULLY**!!!
   **ALWAYS** check for **ALL** security issues and **EVERY** performance problem!!!
   ```

Each rule includes automated checks for:
- Pattern recognition
- Context analysis
- Severity assessment
- Specific improvement suggestions

You can disable specific rules for sections of your prompt using comments:
```prompt
#prompt-linter ignore
This section will not be checked
#endignore
```