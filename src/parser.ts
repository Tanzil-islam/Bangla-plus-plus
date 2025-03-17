// parser.ts
import { Token, TokenType } from './lexer';

export interface Node {
  type: string;
}

export interface Program extends Node {
  type: 'Program';
  body: Statement[];
}

export type Statement = 
  | VariableDeclaration
  | FunctionDeclaration
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | DoWhileStatement
  | BlockStatement
  | ExpressionStatement
  | PrintStatement
  | ScanStatement
  | BreakStatement
  | ContinueStatement;

export interface VariableDeclaration extends Node {
  type: 'VariableDeclaration';
  dataType: TokenType;
  isConstant: boolean;
  identifier: string;
  initializer: Expression | null;
}

export interface ConcatExpression extends Node {
  type: "ConcatExpression";
  expressions: Expression[];
}

export interface FunctionDeclaration extends Node {
  type: 'FunctionDeclaration';
  returnType: TokenType;
  name: string;
  params: { name: string, dataType: TokenType }[];
  body: BlockStatement;
}

export interface ReturnStatement extends Node {
  type: 'ReturnStatement';
  argument: Expression | null;
}

export interface IfStatement extends Node {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface WhileStatement extends Node {
  type: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface ForStatement extends Node {
  type: 'ForStatement';
  init: VariableDeclaration | ExpressionStatement | null;
  test: Expression | null;
  update: Expression | null;
  body: Statement;
}

export interface DoWhileStatement extends Node {
  type: 'DoWhileStatement';
  body: Statement;
  test: Expression;
}

export interface BlockStatement extends Node {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ExpressionStatement extends Node {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface PrintStatement extends Node {
  type: 'PrintStatement';
  expression: Expression;
}

export interface ScanStatement extends Node {
  type: 'ScanStatement';
  identifier: string;
  prompt?: Expression; // Optional prompt message
}

export interface BreakStatement extends Node {
  type: 'BreakStatement';
}

export interface ContinueStatement extends Node {
  type: 'ContinueStatement';
}

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | Identifier
  | Literal
  | AssignmentExpression
  | ConcatExpression
  | CallExpression;

export interface BinaryExpression extends Node {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends Node {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
}

export interface Identifier extends Node {
  type: 'Identifier';
  name: string;
}

export interface Literal extends Node {
  type: 'Literal';
  value: number | string | boolean;
  valueType: 'number' | 'float' | 'string' | 'boolean';
}

export interface AssignmentExpression extends Node {
  type: 'AssignmentExpression';
  operator: string;
  left: Identifier;
  right: Expression;
}

export interface CallExpression extends Node {
  type: 'CallExpression';
  callee: Identifier;
  arguments: Expression[];
}

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const token = this.peek();
    throw new Error(`${message} at line ${token.line}, column ${token.column}`);
  }

  public parse(): Program {
    const program: Program = {
      type: 'Program',
      body: []
    };

    while (!this.isAtEnd()) {
      program.body.push(this.declaration());
    }

    return program;
  }

  private declaration(): Statement {
    if (this.match(TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.STRING)) {
      return this.variableDeclaration(this.previous().type);
    }

    return this.statement();
  }

  private variableDeclaration(dataType: TokenType): VariableDeclaration {
    const isConstant = this.match(TokenType.CONST);
    
    const identifier = this.consume(TokenType.IDENTIFIER, "Expect variable name").value as string;
    
    let initializer: Expression | null = null;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.expression();
    }
    
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration");
    
    return {
      type: 'VariableDeclaration',
      dataType,
      isConstant,
      identifier,
      initializer
    };
  }

  private statement(): Statement {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.SCAN)) return this.scanStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.DO)) return this.doWhileStatement();
    if (this.match(TokenType.BREAK)) return this.breakStatement();
    if (this.match(TokenType.CONTINUE)) return this.continueStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.LBRACE)) return this.blockStatement();
    
    return this.expressionStatement();
  }

  private printStatement(): PrintStatement {
    this.consume(TokenType.LPAREN, "Expect '(' after 'bolo'");

    const expressions: Expression[] = [];
    do {
        expressions.push(this.expression());
    } while (this.match(TokenType.COMMA));

    this.consume(TokenType.RPAREN, "Expect ')' after print arguments");
    this.consume(TokenType.SEMICOLON, "Expect ';' after print statement");

    return {
        type: 'PrintStatement',
        expression: expressions.length === 1 
            ? expressions[0]
            : { type: "ConcatExpression", expressions } as ConcatExpression
    };
  }

  private scanStatement(): ScanStatement {
    this.consume(TokenType.LPAREN, "Expect '(' after 'poro'");
    
    let prompt: Expression | undefined;
    let identifier: string;
    
    if (this.check(TokenType.STRING) || this.check(TokenType.IDENTIFIER)) {
        // ✅ Parse the prompt expression if provided
        prompt = this.expression();
        this.consume(TokenType.COMMA, "Expect ',' after prompt in 'poro'");
    }

    identifier = this.consume(TokenType.IDENTIFIER, "Expect variable name in 'poro'").value as string;
    
    this.consume(TokenType.RPAREN, "Expect ')' after scan arguments");
    this.consume(TokenType.SEMICOLON, "Expect ';' after scan statement");
    
    return {
        type: 'ScanStatement',
        identifier,
        prompt
    };
}


  private ifStatement(): IfStatement {
    this.consume(TokenType.LPAREN, "Expect '(' after 'jodi'");
    const test = this.expression();
    this.consume(TokenType.RPAREN, "Expect ')' after condition");
    
    const consequent = this.statement();
    
    let alternate: Statement | null = null;
    if (this.match(TokenType.ELSEIF)) {
      // Handle else-if by creating a nested if statement
      alternate = this.ifStatement();
    } else if (this.match(TokenType.ELSE)) {
      alternate = this.statement();
    }
    
    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    };
  }

  private whileStatement(): WhileStatement {
    this.consume(TokenType.LPAREN, "Expect '(' after 'jotokhon'");
    const test = this.expression();
    this.consume(TokenType.RPAREN, "Expect ')' after condition");
    
    const body = this.statement();
    
    return {
      type: 'WhileStatement',
      test,
      body
    };
  }

  private forStatement(): ForStatement {
    this.consume(TokenType.LPAREN, "Expect '(' after 'chokro'");
    
    // Initialization
    let init: VariableDeclaration | ExpressionStatement | null = null;
    if (!this.match(TokenType.SEMICOLON)) {
      if (this.match(TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.STRING)) {
        init = this.variableDeclaration(this.previous().type);
      } else {
        init = this.expressionStatement();
      }
    }
    
    // Condition
    let test: Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      test = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition");
    
    // Update
    let update: Expression | null = null;
    if (!this.check(TokenType.RPAREN)) {
      update = this.expression();
    }
    this.consume(TokenType.RPAREN, "Expect ')' after for clauses");
    
    const body = this.statement();
    
    return {
      type: 'ForStatement',
      init,
      test,
      update,
      body
    };
  }

  private doWhileStatement(): DoWhileStatement {
    const body = this.statement();
    
    this.consume(TokenType.WHILE, "Expect 'jotokhon' after do body");
    this.consume(TokenType.LPAREN, "Expect '(' after 'jotokhon'");
    const test = this.expression();
    this.consume(TokenType.RPAREN, "Expect ')' after condition");
    this.consume(TokenType.SEMICOLON, "Expect ';' after do-while statement");
    
    return {
      type: 'DoWhileStatement',
      body,
      test
    };
  }

  private breakStatement(): BreakStatement {
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'thamo'");
    return { type: 'BreakStatement' };
  }

  private continueStatement(): ContinueStatement {
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'cholo'");
    return { type: 'ContinueStatement' };
  }

  private returnStatement(): ReturnStatement {
    let argument: Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      argument = this.expression();
    }
    
    this.consume(TokenType.SEMICOLON, "Expect ';' after return statement");
    
    return {
      type: 'ReturnStatement',
      argument
    };
  }

  private blockStatement(): BlockStatement {
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    
    this.consume(TokenType.RBRACE, "Expect '}' after block");
    
    return {
      type: 'BlockStatement',
      body: statements
    };
  }

  private expressionStatement(): ExpressionStatement {
    const expression = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression");
    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expr = this.logicalOr();
    
    if (this.match(TokenType.ASSIGN)) {
      const value = this.assignment();
      
      if (expr.type === 'Identifier') {
        return {
          type: 'AssignmentExpression',
          operator: '=',
          left: expr,
          right: value
        };
      }
      
      throw new Error("Invalid assignment target");
    }
    
    return expr;
  }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();
    
    while (this.match(TokenType.OR)) {
      const operator = "||";
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.equality();
    
    while (this.match(TokenType.AND)) {
      const operator = "&&";
      const right = this.equality();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();
    
    while (this.match(TokenType.EQ, TokenType.NEQ)) {
      const operator = this.previous().type === TokenType.EQ ? "==" : "!=";
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();
    
    while (this.match(TokenType.GT, TokenType.GEQ, TokenType.LT, TokenType.LEQ)) {
      let operator: string;
      switch (this.previous().type) {
        case TokenType.GT: operator = ">"; break;
        case TokenType.GEQ: operator = ">="; break;
        case TokenType.LT: operator = "<"; break;
        case TokenType.LEQ: operator = "<="; break;
        default: operator = ""; // This should never happen
      }
      
      const right = this.term();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private term(): Expression {
    let expr = this.factor();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().type === TokenType.PLUS ? "+" : "-";
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();
    
    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MOD)) {
      let operator: string;
      switch (this.previous().type) {
        case TokenType.MULTIPLY: operator = "*"; break;
        case TokenType.DIVIDE: operator = "/"; break;
        case TokenType.MOD: operator = "%"; break;
        default: operator = ""; // This should never happen
      }
      
      const right = this.unary();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS)) {
      const operator = this.previous().type === TokenType.NOT ? "!" : "-";
      const right = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        argument: right
      };
    }
    
    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.NUMBER)) {
        return {
            type: 'Literal',
            value: this.previous().value as number,
            valueType: 'number'
        };
    }

    if (this.match(TokenType.FLOAT_NUMBER)) {
        return {
            type: 'Literal',
            value: this.previous().value as number,
            valueType: 'float'
        };
    }

    if (this.match(TokenType.STRING)) {
        return {
            type: 'Literal',
            value: this.previous().value as string,
            valueType: 'string'
        };
    }

    if (this.match(TokenType.TRUE, TokenType.FALSE)) {
        return {
            type: 'Literal',
            value: this.previous().type === TokenType.TRUE,
            valueType: 'boolean'
        };
    }

    if (this.match(TokenType.IDENTIFIER)) {
        return {
            type: 'Identifier',
            name: this.previous().value as string
        };
    }

    if (this.match(TokenType.LPAREN)) {
        const expr = this.expression();
        this.consume(TokenType.RPAREN, "Expect ')' after expression");
        return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().type}`);
  }
}