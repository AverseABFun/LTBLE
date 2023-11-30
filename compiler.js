'use strict';
const process = require('process');
const fs = require("fs");

let keywords = [
    "include",
    "lang",
    "program",
    "on",
    "in",
    "of"
];

function tokenize(code) {
    let current = 0;

    let tokens = [];

    while (current < code.length) {
        let char = code[current];
        process.stdout.write(char);

        if (char === ';') {
            current++;
            continue;
        }

        if (char === "{") {
            tokens.push({
                type: 'brace',
                value: "{"
            });

            current++;

            continue;
        }

        if (char === "}") {
            tokens.push({
                type: 'brace',
                value: "}"
            });

            current++;

            continue;
        }

        if (char === "(") {
            tokens.push({
                type: 'paren',
                value: "("
            });

            current++;

            continue;
        }

        if (char === ")") {
            tokens.push({
                type: 'paren',
                value: ")"
            });

            current++;

            continue;
        }

        let WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        let NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) {
            let value = '';
            let first = true;
            while (NUMBERS.test(char)) {
                value += char;
                if (!first) {
                    process.stdout.write(char);
                } else {
                    first = false;
                }
                char = code[++current];
            }
            tokens.push({ type: 'number', value });

            continue;
        }

        if (char === ".") {
            tokens.push({ type: 'dot', value: "." });
            current++;
            
            continue;
        }

        if (char == "#" || (char == "/" && code[current+1] == "/")) {

            while (char !== "\n") {
                char = code[++current];
            }

            continue;
        }

        if (char === '"') {
            let value = '';
            char = code[++current];
      
            while (char !== '"') {
                value += char;
                process.stdout.write(char);
                char = code[++current];
            }
            process.stdout.write('"');
            char = code[++current];
            tokens.push({ type: 'string', value });
      
            continue;
        }
        if (char === "'") {
            let value = '';
            char = code[++current];
      
            while (char !== "'") {
                value += char;
                process.stdout.write(char);
                char = code[++current];
            }
            process.stdout.write("'");
      
            char = code[++current];
            tokens.push({ type: 'string', value });
      
            continue;
        }
        let LETTERS = /[a-z0-9:]/i;
        if (LETTERS.test(char)) {
            let value = '';
            let first = true;
            while (LETTERS.test(char)) {
                value += char;
                if (!first) {
                    process.stdout.write(char);
                } else {
                    first = false;
                }
                char = code[++current];
            }

            if (keywords.includes(value)) {
                tokens.push({ type: 'keyword', value });
            } else {
                tokens.push({ type: 'name', value });
            }

            continue;
        }

        throw new TypeError('I dont know what this character is: ' + char + ' location ' + current);
    }
    return tokens;
}

function parse(tokens) {
    let current = 0;

    function walk() {
        let token = tokens[current];

        if (token.type === 'number') {
            current++;
            if (tokens[current].type === "dot" && tokens[current+1].type === 'number') {
                current += 2;
                return {
                    type: "NumberLiteral",
                    value: parseFloat(token.value+"."+tokens[current+1])
                };
            }
            return {
                type: "NumberLiteral",
                value: token.value
            };
        }

        if (token.type === 'string') {
            current++;
        
            return {
                type: 'StringLiteral',
                value: token.value,
            };
        }

        if (token.type === 'brace' &&
            token.value === '{') {
            token = tokens[++current];

            let node = {
                type: 'Block',
                blocks: [],
            };

            while (
                (token.type !== 'brace') ||
                (token.type === 'brace' && token.value !== '}')
            ) {
                node.blocks.push(walk());
                token = tokens[current];
            }

            current++;
            return node;
        }
        if (token.type === "keyword") {
            current++;
            
            return {
                type: "Keyword",
                value: token.value
            };
        }
        if (token.type === "dot") {
            current++;

            return {
                type: "FuncSep",
                value: "."
            }
        }
        if (token.type === "name") {
            current++;

            return {
                type: "Name",
                value: token.value
            };
        }
        if (token.type === "paren" &&
            token.value === "(") {
            token = tokens[++current];

            let node = {
                type: 'Parameters',
                params: [],
            };

            while (
                (token.type !== 'paren') ||
                (token.type === 'paren' && token.value !== ')')
            ) {
                node.params.push(walk());
                token = tokens[current];
            }

            current++;
            return node;
        }
        throw new TypeError(token.type + " at " + current);
    }

    let ast = {
        type: 'Program',
        body: [],
    };

    while (current < tokens.length) {
        ast.body.push(walk());
    }

    return ast;
}

function traverse(ast, visitor) {

}

function transform(ast) {

}

function execute(node) {

}

function interpret(code) {
    let tokens = tokenize(code);
    console.log(tokens);
    let ast = parse(tokens);
    console.log(ast);
    let newAst = transform(ast);
    let output = execute(newAst);

    return output;
}
fs.readFile("example.ltble", 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    interpret(data);
});