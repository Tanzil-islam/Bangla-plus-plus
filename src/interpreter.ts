// interpreter.ts
import { Program, Statement, Expression, Node, ScanStatement } from './parser';
import { TokenType } from './lexer';
import * as readline from 'readline';

// Execution environment to store variables
export interface Environment {
  parent: Environment | null;
  variables: Map<string, any>;
  constants: Set<string>;

}

// Runtime control signals
class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
}

export class Interpreter {
  private environment: Environment;
  private rl: readline.Interface | null = null;

  constructor() {
    // Initialize global environment
    this.environment = {
      parent: null,
      variables: new Map<string, any>(),
      constants: new Set<string>()
    };

    // Setup readline interface for input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Create a new environment with the current as parent
  private createEnvironment(parent: Environment): Environment {
    return { parent, variables: new Map<string, any>(), constants: new Set<string>() };
  }

  // Look up a variable in the current environment or parent environments
  private lookupVariable(name: string): { env: Environment, value: any } {
    let env: Environment | null = this.environment;
    
    while (env !== null) {
      if (env.variables.has(name)) {
        return { env, value: env.variables.get(name) };
      }
      env = env.parent;
    }
    
    throw new Error(`Variable '${name}' is not defined`);
  }

  // Interpret a program
  public async interpret(program: Program): Promise<void> {
    try {
      for (const statement of program.body) {
        // Await each statement to handle async operations properly
        await this.evaluateStatement(statement);
      }
    } catch (error) {
      if (error instanceof BreakSignal || error instanceof ContinueSignal || error instanceof ReturnSignal) {
        throw new Error(`Unexpected control flow outside of a loop or function`);
      }
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    } finally {
      // Ensure readline is closed properly after execution
      if (this.rl) {
        this.rl.close();
      }
    }
  }

  // Evaluate a program node
  private async evaluateProgram(program: Program): Promise<any> {
    let result: any = undefined;
    
    for (const statement of program.body) {
      result = await this.evaluateStatement(statement);
    }
    
    return result;
  }

  // Evaluate a statement
  private async evaluateStatement(statement: Statement): Promise<any> {
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
        return await this.evaluateScanStatement(statement);
      default:
        throw new Error(`Unknown statement type: ${(statement as any).type}`);
    }
  }

  // Evaluate variable declaration
  private evaluateVariableDeclaration(declaration: any): any {
    const { identifier, initializer, isConstant, dataType } = declaration;
    
    // Check if the variable is already defined in the current scope
    if (this.environment.variables.has(identifier)) {
      throw new Error(`Variable '${identifier}' is already defined in this scope`);
    }
    
    // Evaluate the initializer if it exists
    let value: any = null;
    
    if (initializer) {
      value = this.evaluateExpression(initializer);
      
      // Type checking
      if (dataType === TokenType.INT && !Number.isInteger(value) && typeof value === 'number') {
        value = Math.floor(value); // Convert to integer
      } else if (dataType === TokenType.FLOAT && typeof value !== 'number') {
        throw new Error(`Type mismatch: Expected float but got ${typeof value}`);
      } else if (dataType === TokenType.STRING && typeof value !== 'string') {
        value = String(value); // Convert to string
      } else if (dataType === TokenType.CHAR && (typeof value !== 'string' || value.length !== 1)) {
        throw new Error(`Type mismatch: Expected char but got ${typeof value}`);
      }
    } else {
      // Default values based on type
      switch (dataType) {
        case TokenType.INT:
          value = 0;
          break;
        case TokenType.FLOAT:
          value = 0.0;
          break;
        case TokenType.STRING:
          value = "";
          break;
        case TokenType.CHAR:
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
  private async evaluateBlockStatement(block: any): Promise<any> {
    // Create a new environment for the block
    const previousEnv = this.environment;
    this.environment = this.createEnvironment(previousEnv);
    
    try {
      let result: any = undefined;
      
      for (const statement of block.body) {
        try {
          result = await this.evaluateStatement(statement);
        } catch (error) {
          if (error instanceof BreakSignal || error instanceof ContinueSignal || error instanceof ReturnSignal) {
            throw error; // Re-throw control signals
          }
          if (error instanceof Error) {
            throw error;
          } else {
            throw new Error(String(error));
          }
        }
      }
      
      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
    }
  }

  // Evaluate if statement
  private async evaluateIfStatement(statement: any): Promise<any> {
    const condition = this.evaluateExpression(statement.test);
    
    if (condition) {
      return await this.evaluateStatement(statement.consequent);
    } else if (statement.alternate) {
      return await this.evaluateStatement(statement.alternate);
    }
    
    return undefined;
  }

  // Evaluate while statement
  private async evaluateWhileStatement(statement: any): Promise<any> {
    let result: any = undefined;
    
    while (this.evaluateExpression(statement.test)) {
      try {
        result = await this.evaluateStatement(statement.body);
      } catch (error) {
        if (error instanceof BreakSignal) {
          break;
        } else if (error instanceof ContinueSignal) {
          continue;
        } else if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(String(error));
        }
      }
    }
    
    return result;
  }

  // Evaluate for statement
  private async evaluateForStatement(statement: any): Promise<any> {
    // Create a new environment for the for loop
    const previousEnv = this.environment;
    this.environment = this.createEnvironment(previousEnv);
    
    try {
      // Initialization
      if (statement.init) {
        await this.evaluateStatement(statement.init);
      }
      
      let result: any = undefined;
      
      // Condition and body
      while (!statement.test || this.evaluateExpression(statement.test)) {
        try {
          result = await this.evaluateStatement(statement.body);
        } catch (error) {
          if (error instanceof BreakSignal) {
            break;
          } else if (error instanceof ContinueSignal) {
            // Do nothing, just continue to the update
          } else if (error instanceof Error) {
            throw error;
          } else {
            throw new Error(String(error));
          }
        }
        
        // Update
        if (statement.update) {
          this.evaluateExpression(statement.update);
        }
      }
      
      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
    }
  }

  // Evaluate do-while statement
  private async evaluateDoWhileStatement(statement: any): Promise<any> {
    let result: any = undefined;
    
    do {
      try {
        result = await this.evaluateStatement(statement.body);
      } catch (error) {
        if (error instanceof BreakSignal) {
          break;
        } else if (error instanceof ContinueSignal) {
          continue;
        } else if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(String(error));
        }
      }
    } while (this.evaluateExpression(statement.test));
    
    return result;
  }

  // Evaluate print statement
  private evaluatePrintStatement(statement: any): any {
    const value = this.evaluateExpression(statement.expression);
    console.log(value);
    return value;
  }

  // Evaluate scan statement - This is the "poro" functionality
// Interpreter: Handling the user input asynchronously
private async evaluateScanStatement(statement: ScanStatement): Promise<any> {
  return new Promise((resolve) => {
    const { identifier, prompt } = statement;
    const promptText = prompt ? this.evaluateExpression(prompt) : "";
    
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    this.rl.question(promptText ? `${promptText}` : "Enter value: ", (line: string) => {
      let value: any;
      let env: Environment = this.environment; // Default to current environment
      
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
        } else if (typeof currentValue === "string") {
          value = line;
        } else {
          value = line; // Default to string if unknown type
        }
      } catch (error) {
        // If variable doesn't exist yet, treat it as a string by default
        // (you might want to add type inference here)
        if (error instanceof Error && error.message.includes('is not defined')) {
          value = line; // Default to string for new variables
          // Already using the current environment (this.environment)
        } else {
          throw error;
        }
      }
      
      // Update or create the variable in the appropriate environment
      env.variables.set(identifier, value);
      resolve(value);
    });
  });
}


  // Evaluate expressions
  private evaluateExpression(expression: Expression): any {
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
        throw new Error(`Unknown expression type: ${(expression as any).type}`);
    }
  }

  // Evaluate binary expression
  private evaluateBinaryExpression(expression: any): any {
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
  private evaluateUnaryExpression(expression: any): any {
    const argument = this.evaluateExpression(expression.argument);
    
    switch (expression.operator) {
      case '-': return -argument;
      case '!': return !argument;
      default:
        throw new Error(`Unknown unary operator: ${expression.operator}`);
    }
  }

  // Evaluate identifier
  private evaluateIdentifier(expression: any): any {
    return this.lookupVariable(expression.name).value;
  }

  // Evaluate literal
  private evaluateLiteral(expression: any): any {
    return expression.value;
  }

  // Evaluate assignment expression
  private evaluateAssignmentExpression(expression: any): any {
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
    } catch (error) {
      // If the variable doesn't exist, create it in the current environment
      if (error instanceof Error && error.message.includes('is not defined')) {
        this.environment.variables.set(name, value);
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    }
    
    return value;
  }

  // Evaluate concatenation expression
  private evaluateConcatExpression(expression: any): any {
    return expression.expressions
      .map((expr: Expression) => this.evaluateExpression(expr))
      .join(' ');
  }

  // Evaluate function call
  private evaluateCallExpression(expression: any): any {
    // Not implementing function call for now as it's not in the requirements
    throw new Error('Function calls are not implemented');
  }
}