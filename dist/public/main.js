document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = document.getElementById('code-editor');
    const output = document.getElementById('output');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyOutputBtn = document.getElementById('copy-output');
    const exampleSelect = document.getElementById('example-select');

    // Examples
    const examples = {
        hello: 'bolo ("Hello Banglish!");',
        variables: 'purnosongkha x = 10;\nbolo ("This is the value of X: ", x);',
        conditionals: 'purnosongkha x=10;\njodi (x > 5) {\n  bolo ("x is greater than 5");\n} nahole {\n  bolo ("x is 5 or less");\n}',
        loops: 'chokro (purnosongkha i = 0; i < 5; i = i + 1) {\n  bolo (i);\n}'
    };

    // Load example code
    exampleSelect.addEventListener('change', () => {
        const selectedExample = exampleSelect.value;
        if (selectedExample && examples[selectedExample]) {
            codeEditor.value = examples[selectedExample];
        }
    });

    // Run code
    runBtn.addEventListener('click', async () => {
        const code = codeEditor.value;
        if (!code.trim()) {
            output.textContent = "Please enter some code to run.";
            return;
        }

        output.textContent = "Running...";
        
        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            const result = await response.json();
            
            if (response.ok) {
                output.textContent = result.output || "Program executed successfully with no output.";
            } else {
                output.textContent = `Error: ${result.error || "Unknown error occurred"}`;
            }
        } catch (error) {
            output.textContent = `Error: ${error.message || "Failed to connect to the server"}`;
        }
    });

    // Clear code and output
    clearBtn.addEventListener('click', () => {
        codeEditor.value = '';
        output.textContent = '';
    });

    // Copy output to clipboard
    copyOutputBtn.addEventListener('click', () => {
        const text = output.textContent;
        if (!text) return;

        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = copyOutputBtn.textContent;
                copyOutputBtn.textContent = "Copied!";
                setTimeout(() => {
                    copyOutputBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });

    // Keyboard shortcuts
    codeEditor.addEventListener('keydown', (e) => {
        // Ctrl+Enter to run code
        if (e.ctrlKey && e.key === 'Enter') {
            runBtn.click();
        }
    });
});