'use strict';
const process = require('process');

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
        stdout.write(char);

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

            while (NUMBERS.test(char)) {
                value += char;
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
                char = code[++current];
            }
      
            char = code[++current];
            tokens.push({ type: 'string', value });
      
            continue;
        }
        if (char === "'") {
            let value = '';
            char = code[++current];
      
            while (char !== "'") {
                value += char;
                char = code[++current];
            }
      
            char = code[++current];
            tokens.push({ type: 'string', value });
      
            continue;
        }
        let LETTERS = /[a-z0-9:]/i;
        if (LETTERS.test(char)) {
            let value = '';

            while (LETTERS.test(char)) {
                value += char;
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
        if (token.type == "keyword") {
            current++;
            
            return {
                type: "Keyword",
                value: token.value
            };
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
interpret(`lang 1.0;
include standard#console;
include standard#error;
include standard#sleep;
include standard#time:units in global;

program example {
    on start {
        console.out("Hello World!");
        console.err("This is a fake error message!");
        fail error("This is a real error message!");
    }
    on fail(e) of start {
        console.out("This is an error handler of start!");
        sleep(1000ms); // Other units include second(s), nanosecond(ns), minute(m), day(d), month(mo), year(y), and more!
        console.out("The sleep just finished!");

        // You can use this kind of comments...
        #  ...or this kind!
    }
}`);