"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
// parser.ts
const lexer_1 = require("./lexer");
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.tokens = tokens;
    }
    isAtEnd() {
        return this.peek().type === lexer_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        const token = this.peek();
        throw new Error(`${message} at line ${token.line}, column ${token.column}`);
    }
    parse() {
        const program = {
            type: 'Program',
            body: []
        };
        while (!this.isAtEnd()) {
            program.body.push(this.declaration());
        }
        return program;
    }
    declaration() {
        if (this.match(lexer_1.TokenType.INT, lexer_1.TokenType.FLOAT, lexer_1.TokenType.CHAR, lexer_1.TokenType.STRING)) {
            return this.variableDeclaration(this.previous().type);
        }
        return this.statement();
    }
    variableDeclaration(dataType) {
        const isConstant = this.match(lexer_1.TokenType.CONST);
        const identifier = this.consume(lexer_1.TokenType.IDENTIFIER, "Expect variable name").value;
        let initializer = null;
        if (this.match(lexer_1.TokenType.ASSIGN)) {
            initializer = this.expression();
        }
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after variable declaration");
        return {
            type: 'VariableDeclaration',
            dataType,
            isConstant,
            identifier,
            initializer
        };
    }
    statement() {
        if (this.match(lexer_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(lexer_1.TokenType.SCAN))
            return this.scanStatement();
        if (this.match(lexer_1.TokenType.IF))
            return this.ifStatement();
        if (this.match(lexer_1.TokenType.WHILE))
            return this.whileStatement();
        if (this.match(lexer_1.TokenType.FOR))
            return this.forStatement();
        if (this.match(lexer_1.TokenType.DO))
            return this.doWhileStatement();
        if (this.match(lexer_1.TokenType.BREAK))
            return this.breakStatement();
        if (this.match(lexer_1.TokenType.CONTINUE))
            return this.continueStatement();
        if (this.match(lexer_1.TokenType.RETURN))
            return this.returnStatement();
        if (this.match(lexer_1.TokenType.LBRACE))
            return this.blockStatement();
        return this.expressionStatement();
    }
    printStatement() {
        this.consume(lexer_1.TokenType.LPAREN, "Expect '(' after 'bolo'");
        const expressions = [];
        do {
            expressions.push(this.expression());
        } while (this.match(lexer_1.TokenType.COMMA));
        this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after print arguments");
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after print statement");
        return {
            type: 'PrintStatement',
            expression: expressions.length === 1
                ? expressions[0]
                : { type: "ConcatExpression", expressions }
        };
    }
    scanStatement() {
        this.consume(lexer_1.TokenType.LPAREN, "Expect '(' after 'poro'");
        let prompt;
        let identifier;
        if (this.check(lexer_1.TokenType.STRING) || this.check(lexer_1.TokenType.IDENTIFIER)) {
            // ✅ Parse the prompt expression if provided
            prompt = this.expression();
            this.consume(lexer_1.TokenType.COMMA, "Expect ',' after prompt in 'poro'");
        }
        identifier = this.consume(lexer_1.TokenType.IDENTIFIER, "Expect variable name in 'poro'").value;
        this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after scan arguments");
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after scan statement");
        return {
            type: 'ScanStatement',
            identifier,
            prompt
        };
    }
    ifStatement() {
        this.consume(lexer_1.TokenType.LPAREN, "Expect '(' after 'jodi'");
        const test = this.expression();
        this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after condition");
        const consequent = this.statement();
        let alternate = null;
        if (this.match(lexer_1.TokenType.ELSEIF)) {
            // Handle else-if by creating a nested if statement
            alternate = this.ifStatement();
        }
        else if (this.match(lexer_1.TokenType.ELSE)) {
            alternate = this.statement();
        }
        return {
            type: 'IfStatement',
            test,
            consequent,
            alternate
        };
    }
    whileStatement() {
        this.consume(lexer_1.TokenType.LPAREN, "Expect '(' after 'jotokhon'");
        const test = this.expression();
        this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after condition");
        const body = this.statement();
        return {
            type: 'WhileStatement',
            test,
            body
        };
    }
    forStatement() {
        this.consume(lexer_1.TokenType.LPAREN, "Expect '(' after 'chokro'");
        // Initialization
        let init = null;
        if (!this.match(lexer_1.TokenType.SEMICOLON)) {
            if (this.match(lexer_1.TokenType.INT, lexer_1.TokenType.FLOAT, lexer_1.TokenType.CHAR, lexer_1.TokenType.STRING)) {
                init = this.variableDeclaration(this.previous().type);
            }
            else {
                init = this.expressionStatement();
            }
        }
        // Condition
        let test = null;
        if (!this.check(lexer_1.TokenType.SEMICOLON)) {
            test = this.expression();
        }
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after loop condition");
        // Update
        let update = null;
        if (!this.check(lexer_1.TokenType.RPAREN)) {
            update = this.expression();
        }
        this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after for clauses");
        const body = this.statement();
        return {
            type: 'ForStatement',
            init,
            test,
            update,
            body
        };
    }
    doWhileStatement() {
        const body = this.statement();
        this.consume(lexer_1.TokenType.WHILE, "Expect 'jotokhon' after do body");
        this.consume(lexer_1.TokenType.LPAREN, "Expect '(' after 'jotokhon'");
        const test = this.expression();
        this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after condition");
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after do-while statement");
        return {
            type: 'DoWhileStatement',
            body,
            test
        };
    }
    breakStatement() {
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after 'thamo'");
        return { type: 'BreakStatement' };
    }
    continueStatement() {
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after 'cholo'");
        return { type: 'ContinueStatement' };
    }
    returnStatement() {
        let argument = null;
        if (!this.check(lexer_1.TokenType.SEMICOLON)) {
            argument = this.expression();
        }
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after return statement");
        return {
            type: 'ReturnStatement',
            argument
        };
    }
    blockStatement() {
        const statements = [];
        while (!this.check(lexer_1.TokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(lexer_1.TokenType.RBRACE, "Expect '}' after block");
        return {
            type: 'BlockStatement',
            body: statements
        };
    }
    expressionStatement() {
        const expression = this.expression();
        this.consume(lexer_1.TokenType.SEMICOLON, "Expect ';' after expression");
        return {
            type: 'ExpressionStatement',
            expression
        };
    }
    expression() {
        return this.assignment();
    }
    assignment() {
        const expr = this.logicalOr();
        if (this.match(lexer_1.TokenType.ASSIGN)) {
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
    logicalOr() {
        let expr = this.logicalAnd();
        while (this.match(lexer_1.TokenType.OR)) {
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
    logicalAnd() {
        let expr = this.equality();
        while (this.match(lexer_1.TokenType.AND)) {
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
    equality() {
        let expr = this.comparison();
        while (this.match(lexer_1.TokenType.EQ, lexer_1.TokenType.NEQ)) {
            const operator = this.previous().type === lexer_1.TokenType.EQ ? "==" : "!=";
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
    comparison() {
        let expr = this.term();
        while (this.match(lexer_1.TokenType.GT, lexer_1.TokenType.GEQ, lexer_1.TokenType.LT, lexer_1.TokenType.LEQ)) {
            let operator;
            switch (this.previous().type) {
                case lexer_1.TokenType.GT:
                    operator = ">";
                    break;
                case lexer_1.TokenType.GEQ:
                    operator = ">=";
                    break;
                case lexer_1.TokenType.LT:
                    operator = "<";
                    break;
                case lexer_1.TokenType.LEQ:
                    operator = "<=";
                    break;
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
    term() {
        let expr = this.factor();
        while (this.match(lexer_1.TokenType.PLUS, lexer_1.TokenType.MINUS)) {
            const operator = this.previous().type === lexer_1.TokenType.PLUS ? "+" : "-";
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
    factor() {
        let expr = this.unary();
        while (this.match(lexer_1.TokenType.MULTIPLY, lexer_1.TokenType.DIVIDE, lexer_1.TokenType.MOD)) {
            let operator;
            switch (this.previous().type) {
                case lexer_1.TokenType.MULTIPLY:
                    operator = "*";
                    break;
                case lexer_1.TokenType.DIVIDE:
                    operator = "/";
                    break;
                case lexer_1.TokenType.MOD:
                    operator = "%";
                    break;
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
    unary() {
        if (this.match(lexer_1.TokenType.NOT, lexer_1.TokenType.MINUS)) {
            const operator = this.previous().type === lexer_1.TokenType.NOT ? "!" : "-";
            const right = this.unary();
            return {
                type: 'UnaryExpression',
                operator,
                argument: right
            };
        }
        return this.primary();
    }
    primary() {
        if (this.match(lexer_1.TokenType.NUMBER)) {
            return {
                type: 'Literal',
                value: this.previous().value,
                valueType: 'number'
            };
        }
        if (this.match(lexer_1.TokenType.FLOAT_NUMBER)) {
            return {
                type: 'Literal',
                value: this.previous().value,
                valueType: 'float'
            };
        }
        if (this.match(lexer_1.TokenType.STRING)) {
            return {
                type: 'Literal',
                value: this.previous().value,
                valueType: 'string'
            };
        }
        if (this.match(lexer_1.TokenType.TRUE, lexer_1.TokenType.FALSE)) {
            return {
                type: 'Literal',
                value: this.previous().type === lexer_1.TokenType.TRUE,
                valueType: 'boolean'
            };
        }
        if (this.match(lexer_1.TokenType.IDENTIFIER)) {
            return {
                type: 'Identifier',
                name: this.previous().value
            };
        }
        if (this.match(lexer_1.TokenType.LPAREN)) {
            const expr = this.expression();
            this.consume(lexer_1.TokenType.RPAREN, "Expect ')' after expression");
            return expr;
        }
        throw new Error(`Unexpected token: ${this.peek().type}`);
    }
}
exports.Parser = Parser;
