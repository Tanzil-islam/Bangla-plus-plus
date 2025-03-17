"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.TokenType = void 0;
// lexer.ts
var TokenType;
(function (TokenType) {
    TokenType["INT"] = "INT";
    TokenType["FLOAT"] = "FLOAT";
    TokenType["CHAR"] = "CHAR";
    TokenType["STRING"] = "STRING";
    TokenType["CONST"] = "CONST";
    TokenType["SCAN"] = "SCAN";
    TokenType["PRINT"] = "PRINT";
    TokenType["IF"] = "IF";
    TokenType["ELSEIF"] = "ELSEIF";
    TokenType["ELSE"] = "ELSE";
    TokenType["WHILE"] = "WHILE";
    TokenType["FOR"] = "FOR";
    TokenType["DO"] = "DO";
    TokenType["BREAK"] = "BREAK";
    TokenType["CONTINUE"] = "CONTINUE";
    TokenType["RETURN"] = "RETURN";
    TokenType["TRUE"] = "TRUE";
    TokenType["FALSE"] = "FALSE";
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["NOT"] = "NOT";
    TokenType["EQ"] = "EQ";
    TokenType["NEQ"] = "NEQ";
    TokenType["GEQ"] = "GEQ";
    TokenType["LEQ"] = "LEQ";
    TokenType["GT"] = "GT";
    TokenType["LT"] = "LT";
    TokenType["ASSIGN"] = "ASSIGN";
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["MULTIPLY"] = "MULTIPLY";
    TokenType["DIVIDE"] = "DIVIDE";
    TokenType["MOD"] = "MOD";
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["SEMICOLON"] = "SEMICOLON";
    TokenType["COMMA"] = "COMMA";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["NUMBER"] = "NUMBER";
    TokenType["FLOAT_NUMBER"] = "FLOAT_NUMBER";
    TokenType["EOF"] = "EOF"; // End of file
})(TokenType || (exports.TokenType = TokenType = {}));
class Lexer {
    constructor(input) {
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.input = input;
        this.keywords = new Map([
            ['purnosongkha', TokenType.INT],
            ['doshomiksongkha', TokenType.FLOAT],
            ['borno', TokenType.CHAR],
            ['bakko', TokenType.STRING],
            ['dhrubok', TokenType.CONST],
            ['poro', TokenType.SCAN],
            ['bolo', TokenType.PRINT],
            ['jodi', TokenType.IF],
            ['naholejodi', TokenType.ELSEIF],
            ['nahole', TokenType.ELSE],
            ['jotokhon', TokenType.WHILE],
            ['chokro', TokenType.FOR],
            ['koro', TokenType.DO],
            ['thamo', TokenType.BREAK],
            ['cholo', TokenType.CONTINUE],
            ['ferotdao', TokenType.RETURN],
            ['shotto', TokenType.TRUE],
            ['mittha', TokenType.FALSE],
            ['ebong', TokenType.AND],
            ['ba', TokenType.OR]
        ]);
    }
    isAtEnd() {
        return this.position >= this.input.length;
    }
    advance() {
        const char = this.input.charAt(this.position);
        this.position++;
        this.column++;
        return char;
    }
    peek() {
        if (this.isAtEnd())
            return '';
        return this.input.charAt(this.position);
    }
    peekNext() {
        if (this.position + 1 >= this.input.length)
            return '';
        return this.input.charAt(this.position + 1);
    }
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    isAlpha(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    skipWhitespace() {
        while (!this.isAtEnd()) {
            const c = this.peek();
            switch (c) {
                case ' ':
                case '\t':
                case '\r':
                    this.advance();
                    break;
                case '\n':
                    this.line++;
                    this.column = 1;
                    this.advance();
                    break;
                default:
                    return;
            }
        }
    }
    scanToken() {
        this.skipWhitespace();
        if (this.isAtEnd()) {
            return { type: TokenType.EOF, value: null, line: this.line, column: this.column };
        }
        const startColumn = this.column;
        const c = this.advance();
        // ✅ Handle string literals (single and double quotes)
        if (c === '"' || c === "'") {
            let str = "";
            let quoteType = c; // Track which quote type is used
            while (!this.isAtEnd() && this.peek() !== quoteType) {
                str += this.advance();
            }
            if (this.isAtEnd()) {
                throw new Error(`Unterminated string at line ${this.line}, column ${startColumn}`);
            }
            this.advance(); // Consume the closing quote
            return { type: TokenType.STRING, value: str, line: this.line, column: startColumn };
        }
        // ✅ Handle identifiers and keywords
        if (this.isAlpha(c)) {
            let identifier = c;
            while (this.isAlphaNumeric(this.peek())) {
                identifier += this.advance();
            }
            const type = this.keywords.get(identifier) || TokenType.IDENTIFIER;
            return {
                type,
                value: type === TokenType.IDENTIFIER ? identifier : null,
                line: this.line,
                column: startColumn
            };
        }
        // ✅ Handle numbers (integers & floats)
        if (this.isDigit(c)) {
            let number = c;
            while (this.isDigit(this.peek())) {
                number += this.advance();
            }
            // Handle decimal numbers (floating-point)
            if (this.peek() === '.' && this.isDigit(this.peekNext())) {
                number += this.advance(); // Consume '.'
                while (this.isDigit(this.peek())) {
                    number += this.advance();
                }
                return {
                    type: TokenType.FLOAT_NUMBER,
                    value: parseFloat(number),
                    line: this.line,
                    column: startColumn
                };
            }
            return {
                type: TokenType.NUMBER,
                value: parseInt(number, 10),
                line: this.line,
                column: startColumn
            };
        }
        // ✅ Handle multi-character operators (e.g., `==`, `!=`, `>=`, `<=`)
        switch (c) {
            case '(': return { type: TokenType.LPAREN, value: null, line: this.line, column: startColumn };
            case ')': return { type: TokenType.RPAREN, value: null, line: this.line, column: startColumn };
            case '{': return { type: TokenType.LBRACE, value: null, line: this.line, column: startColumn };
            case '}': return { type: TokenType.RBRACE, value: null, line: this.line, column: startColumn };
            case ';': return { type: TokenType.SEMICOLON, value: null, line: this.line, column: startColumn };
            case ',': return { type: TokenType.COMMA, value: null, line: this.line, column: startColumn };
            case '+': return { type: TokenType.PLUS, value: null, line: this.line, column: startColumn };
            case '-': return { type: TokenType.MINUS, value: null, line: this.line, column: startColumn };
            case '*': return { type: TokenType.MULTIPLY, value: null, line: this.line, column: startColumn };
            case '/': return { type: TokenType.DIVIDE, value: null, line: this.line, column: startColumn };
            case '%': return { type: TokenType.MOD, value: null, line: this.line, column: startColumn };
            case '!':
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.NEQ, value: "!=", line: this.line, column: startColumn };
                }
                return { type: TokenType.NOT, value: "!", line: this.line, column: startColumn };
            case '=':
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.EQ, value: "==", line: this.line, column: startColumn };
                }
                return { type: TokenType.ASSIGN, value: "=", line: this.line, column: startColumn };
            case '<':
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.LEQ, value: "<=", line: this.line, column: startColumn };
                }
                return { type: TokenType.LT, value: "<", line: this.line, column: startColumn };
            case '>':
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.GEQ, value: ">=", line: this.line, column: startColumn };
                }
                return { type: TokenType.GT, value: ">", line: this.line, column: startColumn };
        }
        // ❌ Unknown character error
        throw new Error(`Unexpected character: '${c}' at line ${this.line}, column ${startColumn}`);
    }
    getTokens() {
        const tokens = [];
        while (true) {
            const token = this.scanToken();
            tokens.push(token);
            if (token.type === TokenType.EOF) {
                break;
            }
        }
        return tokens;
    }
    nextToken() {
        return this.scanToken();
    }
    /**
     * Tokenize the input string and return an array of tokens
     * @returns Array of tokens
     */
    tokenize() {
        // Reset position, line, and column before tokenizing
        this.position = 0;
        this.line = 1;
        this.column = 1;
        return this.getTokens();
    }
}
exports.Lexer = Lexer;
