# INSTRUCTIONS.md - User Preferences and Guidelines

## Overview
This document contains specific preferences and requirements for AI agents working on the fuzzy-life project. Following these guidelines will ensure optimal performance and alignment with user expectations.

## Project Context
- **Project**: fuzzy-life - A cellular automaton simulation with multiple modes
- **Languages**: English and Slovak (bilingual support)
- **Main Technologies**: React, JavaScript, CSS
- **Location**: `c:\Users\khorev\WebstormProjects\fuzzy-life`

## Language and Translation Preferences

### Slovak Language Requirements
- **Capitalization**: Use normal sentence case, not all caps
  - ✅ Correct: "Pravidlá zrodu", "Podmienka prežitia", "Wolframova klasifikácia"
  - ❌ Incorrect: "Pravidlá Zrodu", "Podmienka Prežitia", "Wolframova Klasifikácia"
- **Terminology**: Use consistent Slovak terminology
  - "zrod" (birth), "prežitie" (survival), "smrť" (death)
  - "susedstvo" (neighborhood), "pravidlá" (rules)

### English Language Requirements
- **Title Case**: Use proper title case for multi-word titles
  - ✅ Correct: "Birth Condition", "Rule Components", "Neighborhood Structure"
  - ❌ Incorrect: "Birth condition", "rule components"
- **Single Word Titles**: Capitalize only first letter
  - ✅ Correct: "Birth", "Survival", "Death"
  - ❌ Incorrect: "BIRTH", "SURVIVAL"

## Default Values and Reset Behavior

### 1D Mode Defaults
- **Birth Rules**: "2,3" (comma-separated)
- **Survival Rules**: "2,4" (comma-separated)
- **Neighborhood Size**: 2
- **Weight Threshold**: 2.0
- **Symmetric Weights**: true

### Reset Functionality
When user clicks "obnoviť predvolené" (Reset to Default):
- Must restore ALL parameters to their original defaults
- Include birth rules, survival rules, neighborhood size, threshold, and weights
- Ensure reset is comprehensive and complete

## Code Style and Structure

### File Organization
- **Modes**: Located in `src/modes/` directory
- **Components**: Located in `src/components/` directory
- **Translations**: Located in `src/i18n/index.js`

### Translation Structure
- Maintain consistent structure across English and Slovak
- Use descriptive keys that reflect content hierarchy
- Keep translations synchronized across languages

### Default Parameter Handling
- Always provide sensible defaults in mode constructors
- Ensure defaults are reflected in help text and placeholders
- Maintain consistency between default values and documentation

## User Interface Preferences

### Modal and Dialog Behavior
- **Weight Editor Modal**: Should properly reset all values when reset button is clicked
- **Placeholders**: Should reflect actual default values
- **Help Text**: Should accurately describe current defaults

### Language Switching
- Support instant language switching
- Maintain user language preference in localStorage
- Ensure all UI elements are properly translated

## Common Tasks and Patterns

### Adding New Modes
1. Create mode file in `src/modes/`
2. Define translations for both English and Slovak
3. Add proper default parameters
4. Include comprehensive help documentation
5. Follow existing naming conventions

### Updating Translations
1. Check both English and Slovak versions
2. Ensure consistent terminology
3. Verify capitalization rules
4. Test language switching functionality

### Modifying Rules/Parameters
1. Update default values in mode constructor
2. Update help text to reflect changes
3. Update any placeholder text
4. Ensure reset functionality works correctly

## Specific File Patterns

### Mode Files (`src/modes/*.js`)
```javascript
const translations = {
    en: {
        label: 'Mode Name',
        description: 'Description in English',
        params: {
            paramName: {
                label: 'Parameter Label',
                help: 'Parameter description'
            }
        }
    },
    sk: {
        label: 'Názov Režimu',
        description: 'Popis v slovenčine',
        params: {
            paramName: {
                label: 'Označenie Parametra',
                help: 'Popis parametra'
            }
        }
    }
};
```

### Translation Updates
When updating translations:
- Maintain parallel structure
- Use consistent terminology
- Follow capitalization rules
- Test both languages

## Quality Assurance

### Testing Requirements
- Test language switching between English and Slovak
- Verify reset functionality restores all defaults
- Check placeholder text matches actual defaults
- Ensure help text is accurate and helpful

### Common Pitfalls to Avoid
- Don't use all caps for titles (especially in Slovak)
- Don't forget to update both default values AND help text
- Don't leave reset functionality incomplete
- Don't mix capitalization styles inconsistently

## Communication Style

### When Reporting Changes
- Be specific about which files were modified
- Explain the reasoning behind changes
- Highlight any user preference considerations
- Provide clear before/after comparisons when relevant

### When Asking for Clarification
- Be specific about what needs clarification
- Provide context about the current state
- Suggest possible interpretations if applicable

## Development Workflow

### Before Making Changes
1. Read existing code to understand current implementation
2. Check for existing patterns and conventions
3. Identify all files that need updates
4. Consider impact on both languages

### After Making Changes
1. Verify all related files are updated consistently
2. Test the specific functionality
3. Check for any side effects
4. Ensure user preferences are maintained

## Emergency Procedures

### If Something Goes Wrong
1. Revert to last known good state
2. Identify what specific change caused the issue
3. Fix the root cause, not just symptoms
4. Test thoroughly before reapplying changes

### Handling Conflicts
- Prioritize user preferences over general conventions
- When in doubt, ask for clarification
- Document any deviations from standard practices

---

**Last Updated**: 2025-02-12  
**Project**: fuzzy-life  
**Maintainer**: AI Agent following user preferences
