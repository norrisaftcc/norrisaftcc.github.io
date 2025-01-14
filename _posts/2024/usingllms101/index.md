# Using LLMs 101 (Summer 2024)

## Course GitHub Repository

You're currently looking at a GitHub Pages site, used as a public-facing landing page. 

Our course material can be found in text form on the [Course Repository](https://github.com/norrisaftcc/ce_usingllms101_24su).

## Blackboard Collaborate - online meeting tool

BB Collab link: [https://us.bbcollab.com/guest/27233fe8edbd4d438d80d89123d4d6ec](https://us.bbcollab.com/guest/27233fe8edbd4d438d80d89123d4d6ec)

BB Collab will allow you to use voice/video chat and share your screen. We'll use this as the primary communication for Thursday online sessions.

Today's assignment: [Explain, Extend, Summarize](https://norrisaftcc.github.io/task_ees.pdf)

---

## Week Two Summary: Exploring Workflows with LLMs and GitHub Pages

This week, we focused on three key workflows that combine the use of Large Language Models (LLMs) with various tools for content creation and publication:

1. **LLM to Markdown to HTML/PDF using Dillinger.io**
   - We learned how to generate content using an LLM in Markdown format.
   - We then used Dillinger.io to convert this Markdown into HTML or PDF formats.
   - This workflow demonstrates how to quickly create formatted documents from LLM-generated content.

2. **LLM to Markdown to PowerPoint using Marp with Visual Studio Code**
   - We explored how to use an LLM to create presentation content in Marp-formatted Markdown.
   - We then used the Marp extension in Visual Studio Code to convert this Markdown into a PowerPoint presentation.
   - This workflow showcases how to efficiently create slide decks from LLM output.

3. **Creating a GitHub Pages Website**
   - We learned the process of setting up a GitHub Pages site, including creating a repository and adding content.
   - We then explored how to enhance the site using Markdown and themes.
   - This workflow demonstrates how to quickly publish and customize web content using GitHub's tools.

These workflows highlight the versatility of using LLMs in conjunction with various tools and platforms to streamline content creation, formatting, and publication processes.

# Using LLMs 101: Week 3 and 4 Summary

## Week 3: Advanced LLM Applications

### Multimedia Generative AI
- **Images**: 
  - bing.com/images/create
  - Stable Diffusion 3 and XL
  - Midjourney
- **Video**: 
  - runway.ai
  - lumalabs.ai/dream-machine/creations
- **Audio**: 
  - elevenlabs.io
- **Music**: 
  - suno.com

### Web Search Enabled Tools
- **Microsoft Copilot**
  - Web version: copilot.microsoft.com
  - 365 Version: Integration with Office applications
- **Perplexity.ai**
  - Conversational search and knowledge retrieval

### Code Generation Tools
- **Replit (repl.it)**
  - In-browser IDE with AI-assisted coding
- **GitHub Copilot**
  - AI-powered code completion and suggestion
- **Cursor**
  - AI-driven code generation and editing

### Project: Creating a Website
- Version 1: Full website using generative AI
- Version 2: Markdown site with GitHub Pages

## Week 4: Prompt Chaining

### Minimal Prompt Chainable
- Sequential prompt chaining with context and output back-referencing
- Implementation in `chain.py`

### When to Use Prompt Chains
1. Complex tasks requiring multiple steps
2. Maximizing performance and reducing errors
3. Using output of previous prompts as input
4. Creating adaptive workflows

### Key Concepts
- Staying close to the prompt ("the metal")
- Avoiding unnecessary abstractions
- Building minimal abstracts that do one thing well

### Practical Application
- Using `MinimalChainable` class to build sequential prompt chains
- Hands-on exercise with `main.py`

### Testing and Debugging
- Running tests with `pytest chain_test.py`
- Importance of clear documentation and debugging practices

### Reflection
- Comparing prompt chaining to single-prompt approaches
- Discussing real-world applications and limitations
