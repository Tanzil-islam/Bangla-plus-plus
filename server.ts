import express, { Request, Response } from 'express';
import { Parser } from './src/parser';
import { Interpreter } from './src/interpreter';
import { Lexer } from './src/lexer';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Interfaces
interface CodeExecutionRequest {
  code: string;
  input?: string[];
}

interface CodeExecutionResponse {
  success: boolean;
  output?: string;
  error?: string;
}

// Serve the web UI
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Custom middleware to capture console output
function captureOutput(callback: (output: string) => void) {
  const originalLog = console.log;
  let output = '';

  console.log = (...args) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    output += message + '\n';
    originalLog.apply(console, args);
  };

  return {
    release: () => {
      console.log = originalLog;
      callback(output);
    }
  };
}

// Mock stdin for the interpreter
class MockReadline {
  private inputs: string[];
  private currentIndex = 0;

  constructor(inputs: string[] = []) {
    this.inputs = inputs;
  }

  createInterface() {
    return {
      question: (prompt: string, callback: (answer: string) => void) => {
        console.log(prompt); // Display prompt in output

        // Get the next input or empty string if none left
        const input = this.currentIndex < this.inputs.length 
          ? this.inputs[this.currentIndex++] 
          : '';

        console.log(input); // Echo input
        callback(input);
      },
      close: () => {}
    };
  }
}

// API: Execute Code
// API: Execute Code
// Add this to your server.ts
app.post('/api/run', async (req: Request, res: Response) => {
  // Simply forward to the existing execute endpoint logic
  try {
    console.log('Request body:', req.body);
    
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request format. Please send a JSON object with a code field.'
      });
    }
    
    const { code, input = [] } = req.body as CodeExecutionRequest;

    if (!code) {
      return res.status(400).json({ success: false, error: 'No code provided' });
    }
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const interpreter = new Interpreter();

    (interpreter as any).rl = new MockReadline(input).createInterface();

    const program = parser.parse();
    let executionOutput = '';
    const outputCapture = captureOutput(output => {
      executionOutput = output;
    });

    try {
      const executionPromise = interpreter.interpret(program);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timed out after 5000ms')), 5000);
      });

      await Promise.race([executionPromise, timeoutPromise]);

      outputCapture.release();
      res.json({ success: true, output: executionOutput });
    } catch (error) {
      outputCapture.release();
      throw error;
    }
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// API: Save Code as File
app.post('/api/save', async (req: Request, res: Response) => {
  try {
    const { filename, code } = req.body;

    if (!filename || !code) {
      return res.status(400).json({ success: false, error: 'Filename and code are required' });
    }

    // const examplesDir = path.join(__dirname, 'examples');
    // await fs.mkdir(examplesDir, { recursive: true });

    // const filePath = path.join(examplesDir, `${filename}.txt`);
    // await fs.writeFile(filePath, code);

    res.json({ success: true, message: `File saved as ${filename}.txt` });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// API: Load Example Code
app.get('/api/examples', async (req: Request, res: Response) => {
  try {
    const examplesDir = path.join(__dirname, 'examples');

    // Check if directory exists
    if (!(await fs.stat(examplesDir).catch(() => false))) {
      return res.json({ success: true, examples: [] });
    }

    const files = (await fs.readdir(examplesDir))
      .filter(file => file.endsWith('.txt'))
      .map(async file => {
        const filePath = path.join(examplesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        return { name: file.replace('.txt', ''), content };
      });

    res.json({ success: true, examples: await Promise.all(files) });
  } catch (error) {
    console.error('Load examples error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Start Server - THIS IS THE CRITICAL PART THAT WAS MISSING
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the code interpreter`);
});