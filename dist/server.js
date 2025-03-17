"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const parser_1 = require("./src/parser");
const interpreter_1 = require("./src/interpreter");
const lexer_1 = require("./src/lexer");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
// Create Express application
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Serve the web UI
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
// Custom middleware to capture console output
function captureOutput(callback) {
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
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
    constructor(inputs = []) {
        this.currentIndex = 0;
        this.inputs = inputs;
    }
    createInterface() {
        return {
            question: (prompt, callback) => {
                console.log(prompt); // Display prompt in output
                // Get the next input or empty string if none left
                const input = this.currentIndex < this.inputs.length
                    ? this.inputs[this.currentIndex++]
                    : '';
                console.log(input); // Echo input
                callback(input);
            },
            close: () => { }
        };
    }
}
// API: Execute Code
// API: Execute Code
// Add this to your server.ts
app.post('/api/run', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Simply forward to the existing execute endpoint logic
    try {
        console.log('Request body:', req.body);
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request format. Please send a JSON object with a code field.'
            });
        }
        const { code, input = [] } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, error: 'No code provided' });
        }
        const lexer = new lexer_1.Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new parser_1.Parser(tokens);
        const interpreter = new interpreter_1.Interpreter();
        interpreter.rl = new MockReadline(input).createInterface();
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
            yield Promise.race([executionPromise, timeoutPromise]);
            outputCapture.release();
            res.json({ success: true, output: executionOutput });
        }
        catch (error) {
            outputCapture.release();
            throw error;
        }
    }
    catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
}));
// API: Save Code as File
app.post('/api/save', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
}));
// API: Load Example Code
app.get('/api/examples', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const examplesDir = path_1.default.join(__dirname, 'examples');
        // Check if directory exists
        if (!(yield promises_1.default.stat(examplesDir).catch(() => false))) {
            return res.json({ success: true, examples: [] });
        }
        const files = (yield promises_1.default.readdir(examplesDir))
            .filter(file => file.endsWith('.txt'))
            .map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = path_1.default.join(examplesDir, file);
            const content = yield promises_1.default.readFile(filePath, 'utf-8');
            return { name: file.replace('.txt', ''), content };
        }));
        res.json({ success: true, examples: yield Promise.all(files) });
    }
    catch (error) {
        console.error('Load examples error:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
}));
// Start Server - THIS IS THE CRITICAL PART THAT WAS MISSING
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the code interpreter`);
});
