"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const lexer_1 = require("./lexer");
const readline = __importStar(require("readline"));
// Runtime control signals
class BreakSignal {
}
class ContinueSignal {
}
class ReturnSignal {
    constructor(value) {
        this.value = value;
    }
}
class Interpreter {
    constructor() {
        this.rl = null;
        // Initialize global environment
        this.environment = {
            parent: null,
            variables: new Map(),
            constants: new Set()
        };
        // Setup readline interface for input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    // Create a new environment with the current as parent
    createEnvironment(parent) {
        return { parent, variables: new Map(), constants: new Set() };
    }
    // Look up a variable in the current environment or parent environments
    lookupVariable(name) {
        let env = this.environment;
        while (env !== null) {
            if (env.variables.has(name)) {
                return { env, value: env.variables.get(name) };
            }
            env = env.parent;
        }
        throw new Error(`Variable '${name}' is not defined`);
    }
    // Interpret a program
    interpret(program) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (const statement of program.body) {
                    // Await each statement to handle async operations properly
                    yield this.evaluateStatement(statement);
                }
            }
            catch (error) {
                if (error instanceof BreakSignal || error instanceof ContinueSignal || error instanceof ReturnSignal) {
                    throw new Error(`Unexpected control flow outside of a loop or function`);
                }
                if (error instanceof Error) {
                    throw error;
                }
                else {
                    throw new Error(String(error));
                }
            }
            finally {
                // Ensure readline is closed properly after execution
                if (this.rl) {
                    this.rl.close();
                }
            }
        });
    }
    // Evaluate a program node
    evaluateProgram(program) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            for (const statement of program.body) {
                result = yield this.evaluateStatement(statement);
            }
            return result;
        });
    }
    // Evaluate a statement
    evaluateStatement(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (statement.type) {
                case 'VariableDeclaration':
                    return this.evaluateVariableDeclaration(statement);
                case 'ExpressionStatement':
                    return this.evaluateExpression(statement.expression);
                case 'BlockStatement':
                    return this.evaluateBlockStatement(statement);
                case 'IfStatement':
                    return this.evaluateIfStatement(statement);
                case 'WhileStatement':
                    return this.evaluateWhileStatement(statement);
                case 'ForStatement':
                    return this.evaluateForStatement(statement);
                case 'DoWhileStatement':
                    return this.evaluateDoWhileStatement(statement);
                case 'BreakStatement':
                    throw new BreakSignal();
                case 'ContinueStatement':
                    throw new ContinueSignal();
                case 'ReturnStatement':
                    throw new ReturnSignal(statement.argument ? this.evaluateExpression(statement.argument) : undefined);
                case 'PrintStatement':
                    return this.evaluatePrintStatement(statement);
                case 'ScanStatement':
                    return yield this.evaluateScanStatement(statement);
                default:
                    throw new Error(`Unknown statement type: ${statement.type}`);
            }
        });
    }
    // Evaluate variable declaration
    evaluateVariableDeclaration(declaration) {
        const { identifier, initializer, isConstant, dataType } = declaration;
        // Check if the variable is already defined in the current scope
        if (this.environment.variables.has(identifier)) {
            throw new Error(`Variable '${identifier}' is already defined in this scope`);
        }
        // Evaluate the initializer if it exists
        let value = null;
        if (initializer) {
            value = this.evaluateExpression(initializer);
            // Type checking
            if (dataType === lexer_1.TokenType.INT && !Number.isInteger(value) && typeof value === 'number') {
                value = Math.floor(value); // Convert to integer
            }
            else if (dataType === lexer_1.TokenType.FLOAT && typeof value !== 'number') {
                throw new Error(`Type mismatch: Expected float but got ${typeof value}`);
            }
            else if (dataType === lexer_1.TokenType.STRING && typeof value !== 'string') {
                value = String(value); // Convert to string
            }
            else if (dataType === lexer_1.TokenType.CHAR && (typeof value !== 'string' || value.length !== 1)) {
                throw new Error(`Type mismatch: Expected char but got ${typeof value}`);
            }
        }
        else {
            // Default values based on type
            switch (dataType) {
                case lexer_1.TokenType.INT:
                    value = 0;
                    break;
                case lexer_1.TokenType.FLOAT:
                    value = 0.0;
                    break;
                case lexer_1.TokenType.STRING:
                    value = "";
                    break;
                case lexer_1.TokenType.CHAR:
                    value = '\0';
                    break;
            }
        }
        // Store the variable
        this.environment.variables.set(identifier, value);
        // Mark as constant if needed
        if (isConstant) {
            this.environment.constants.add(identifier);
        }
        return value;
    }
    // Evaluate block statement
    evaluateBlockStatement(block) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a new environment for the block
            const previousEnv = this.environment;
            this.environment = this.createEnvironment(previousEnv);
            try {
                let result = undefined;
                for (const statement of block.body) {
                    try {
                        result = yield this.evaluateStatement(statement);
                    }
                    catch (error) {
                        if (error instanceof BreakSignal || error instanceof ContinueSignal || error instanceof ReturnSignal) {
                            throw error; // Re-throw control signals
                        }
                        if (error instanceof Error) {
                            throw error;
                        }
                        else {
                            throw new Error(String(error));
                        }
                    }
                }
                return result;
            }
            finally {
                // Restore the previous environment
                this.environment = previousEnv;
            }
        });
    }
    // Evaluate if statement
    evaluateIfStatement(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            const condition = this.evaluateExpression(statement.test);
            if (condition) {
                return yield this.evaluateStatement(statement.consequent);
            }
            else if (statement.alternate) {
                return yield this.evaluateStatement(statement.alternate);
            }
            return undefined;
        });
    }
    // Evaluate while statement
    evaluateWhileStatement(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            while (this.evaluateExpression(statement.test)) {
                try {
                    result = yield this.evaluateStatement(statement.body);
                }
                catch (error) {
                    if (error instanceof BreakSignal) {
                        break;
                    }
                    else if (error instanceof ContinueSignal) {
                        continue;
                    }
                    else if (error instanceof Error) {
                        throw error;
                    }
                    else {
                        throw new Error(String(error));
                    }
                }
            }
            return result;
        });
    }
    // Evaluate for statement
    evaluateForStatement(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a new environment for the for loop
            const previousEnv = this.environment;
            this.environment = this.createEnvironment(previousEnv);
            try {
                // Initialization
                if (statement.init) {
                    yield this.evaluateStatement(statement.init);
                }
                let result = undefined;
                // Condition and body
                while (!statement.test || this.evaluateExpression(statement.test)) {
                    try {
                        result = yield this.evaluateStatement(statement.body);
                    }
                    catch (error) {
                        if (error instanceof BreakSignal) {
                            break;
                        }
                        else if (error instanceof ContinueSignal) {
                            // Do nothing, just continue to the update
                        }
                        else if (error instanceof Error) {
                            throw error;
                        }
                        else {
                            throw new Error(String(error));
                        }
                    }
                    // Update
                    if (statement.update) {
                        this.evaluateExpression(statement.update);
                    }
                }
                return result;
            }
            finally {
                // Restore the previous environment
                this.environment = previousEnv;
            }
        });
    }
    // Evaluate do-while statement
    evaluateDoWhileStatement(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            do {
                try {
                    result = yield this.evaluateStatement(statement.body);
                }
                catch (error) {
                    if (error instanceof BreakSignal) {
                        break;
                    }
                    else if (error instanceof ContinueSignal) {
                        continue;
                    }
                    else if (error instanceof Error) {
                        throw error;
                    }
                    else {
                        throw new Error(String(error));
                    }
                }
            } while (this.evaluateExpression(statement.test));
            return result;
        });
    }
    // Evaluate print statement
    evaluatePrintStatement(statement) {
        const value = this.evaluateExpression(statement.expression);
        console.log(value);
        return value;
    }
    // Evaluate scan statement - This is the "poro" functionality
    // Interpreter: Handling the user input asynchronously
    evaluateScanStatement(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const { identifier, prompt } = statement;
                const promptText = prompt ? this.evaluateExpression(prompt) : "";
                if (!this.rl) {
                    this.rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                }
                this.rl.question(promptText ? `${promptText}` : "Enter value: ", (line) => {
                    let value;
                    let env = this.environment; // Default to current environment
                    try {
                        // Try to look up the variable
                        const variableInfo = this.lookupVariable(identifier);
                        env = variableInfo.env;
                        const currentValue = variableInfo.value;
                        // Convert input type based on the variable type
                        if (typeof currentValue === "number") {
                            value = Number.isInteger(currentValue) ? parseInt(line, 10) : parseFloat(line);
                            if (isNaN(value)) {
                                value = 0; // Default for invalid number input
                            }
                        }
                        else if (typeof currentValue === "string") {
                            value = line;
                        }
                        else {
                            value = line; // Default to string if unknown type
                        }
                    }
                    catch (error) {
                        // If variable doesn't exist yet, treat it as a string by default
                        // (you might want to add type inference here)
                        if (error instanceof Error && error.message.includes('is not defined')) {
                            value = line; // Default to string for new variables
                            // Already using the current environment (this.environment)
                        }
                        else {
                            throw error;
                        }
                    }
                    // Update or create the variable in the appropriate environment
                    env.variables.set(identifier, value);
                    resolve(value);
                });
            });
        });
    }
    // Evaluate expressions
    evaluateExpression(expression) {
        switch (expression.type) {
            case 'BinaryExpression':
                return this.evaluateBinaryExpression(expression);
            case 'UnaryExpression':
                return this.evaluateUnaryExpression(expression);
            case 'Identifier':
                return this.evaluateIdentifier(expression);
            case 'Literal':
                return this.evaluateLiteral(expression);
            case 'AssignmentExpression':
                return this.evaluateAssignmentExpression(expression);
            case 'ConcatExpression':
                return this.evaluateConcatExpression(expression);
            case 'CallExpression':
                return this.evaluateCallExpression(expression);
            default:
                throw new Error(`Unknown expression type: ${expression.type}`);
        }
    }
    // Evaluate binary expression
    evaluateBinaryExpression(expression) {
        const left = this.evaluateExpression(expression.left);
        const right = this.evaluateExpression(expression.right);
        switch (expression.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '==': return left === right;
            case '!=': return left !== right;
            case '>': return left > right;
            case '>=': return left >= right;
            case '<': return left < right;
            case '<=': return left <= right;
            case '&&': return left && right;
            case '||': return left || right;
            default:
                throw new Error(`Unknown binary operator: ${expression.operator}`);
        }
    }
    // Evaluate unary expression
    evaluateUnaryExpression(expression) {
        const argument = this.evaluateExpression(expression.argument);
        switch (expression.operator) {
            case '-': return -argument;
            case '!': return !argument;
            default:
                throw new Error(`Unknown unary operator: ${expression.operator}`);
        }
    }
    // Evaluate identifier
    evaluateIdentifier(expression) {
        return this.lookupVariable(expression.name).value;
    }
    // Evaluate literal
    evaluateLiteral(expression) {
        return expression.value;
    }
    // Evaluate assignment expression
    evaluateAssignmentExpression(expression) {
        const { left, right } = expression;
        if (left.type !== 'Identifier') {
            throw new Error('Left side of assignment must be an identifier');
        }
        const name = left.name;
        const value = this.evaluateExpression(right);
        // Find the environment where the variable is defined
        try {
            const { env } = this.lookupVariable(name);
            // Check if the variable is a constant
            if (env.constants.has(name)) {
                throw new Error(`Cannot assign to constant variable: ${name}`);
            }
            // Update the variable
            env.variables.set(name, value);
        }
        catch (error) {
            // If the variable doesn't exist, create it in the current environment
            if (error instanceof Error && error.message.includes('is not defined')) {
                this.environment.variables.set(name, value);
            }
            else if (error instanceof Error) {
                throw error;
            }
            else {
                throw new Error(String(error));
            }
        }
        return value;
    }
    // Evaluate concatenation expression
    evaluateConcatExpression(expression) {
        return expression.expressions
            .map((expr) => this.evaluateExpression(expr))
            .join(' ');
    }
    // Evaluate function call
    evaluateCallExpression(expression) {
        // Not implementing function call for now as it's not in the requirements
        throw new Error('Function calls are not implemented');
    }
}
exports.Interpreter = Interpreter;
