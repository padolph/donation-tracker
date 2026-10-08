# AI Agent Workflow & Methodology

## 1. The Planning Phase
* **Think Before Acting:** For any feature request, you must first generate a numbered, step-by-step Markdown plan. 
* **Pause for Review:** Do not write implementation code during the planning phase. Present the plan and wait for confirmation to proceed.

## 2. Test-Driven Development (TDD)
* **Strict TDD:** This project strictly follows Test-Driven Development. You must write tests *before* writing the implementation code.
* **Testing Stack:** Use Jest and React Testing Library for frontend components. Use standard Jest for backend/action logic.
* **The Cycle:** For each step in the plan:
    1. Write the unit/integration tests for the specific component or function.
    2. Write the implementation code to satisfy the tests.
    3. Run the tests (or instruct the user to run them) to verify the step is complete before moving to the next step.
* **Note:** Do not do TDD for changes to configuration files like YAML, MD, etc.

## 3. Step-by-Step Execution
* **Iterative Building:** Execute the approved plan strictly one step at a time. Do not attempt to build the entire feature in a single output.
* **Validation:** If a test fails or an error occurs, halt the plan and fix the immediate issue before proceeding to the next step in the checklist.

## 4. Version Control
* **Changes on Branch** Make all changes on a branch off main latest. If not currently on a branch, spawn one off main latest. Name branches according to Conventional Commits conventions.
* **Lint Before Committing** Run all linting scripts before committing to the branch.
* **Push and Merge** Feel free to commit and push on the working branch. Merge a pull request to main only when the project owner asks for it and CI is green, using a merge commit. Never push directly to main.
* **Conventional Commits** Use Conventional Commits (https://www.conventionalcommits.org/en/v1.0.0/conventions) for branch naming and commit messages.
