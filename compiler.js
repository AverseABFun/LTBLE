'use strict';
const process = require('process');
const fs = require("fs");
const util = require("node:util");

const INTERPRETER_VERSION = 1.01;
const INTERPRETER_STRING = "ORIGINAL VERSION - LTBLE Beef";
const SUPPORTED_VERSIONS = [1.01];

const args = util.parseArgs({
    options: {
        file: {
            type: "string",
            short: "q",
        },
    },
    allowPositionals: true
});

class VersionError extends Error {}

let keywords = [
    "include",
    "lang",
    "program",
    "on",
    "in",
    "of"
];

let keywordsWithDataAfter = [
    "include",
    "lang",
    "program",
    "of",
    "on",
    "in"
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

        let NUMBERS = /[0-9\.]/;
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
            if (token.value instanceof String) {
                return {
                    type: "NumberLiteral",
                    value: parseFloat(token.value)
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
                body: [],
            };

            while (
                (token.type !== 'brace') ||
                (token.type === 'brace' && token.value !== '}')
            ) {
                node.body.push(walk());
                token = tokens[current];
            }

            current++;
            return node;
        }
        if (token.type === "keyword") {
            current++;

            if (keywordsWithDataAfter.includes(token.value)) {
                current++;
                if (tokens[current].value === "in" && token.value === "include") {
                    current++;
                    current++;
                    return {
                        type: "Keyword",
                        value: token.value,
                        data: tokens[current-3].value,
                        scope: tokens[current-1].value
                    };
                }
                return {
                    type: "Keyword",
                    value: token.value,
                    data: tokens[current-1].value
                };
            }
            
            return {
                type: "Keyword",
                value: token.value
            };
        }
        if (token.type === "dot") {
            throw new SyntaxError("Invalid position of character `.` at " + current + " in parser (context: " + JSON.stringify(tokens.slice(current-4, current+4)))
        }
        if (token.type === "name") {
            current++;

            if (tokens[current].type === "dot" && tokens[current+1].type === "name") {
                current += 2;
                return {
                    type: "Name",
                    value: token.value + "." + tokens[current-1].value
                }
            }

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
    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }
    
    function traverseNode(node, parent) {
        let methods = visitor[node.type];

        if (methods && methods.enter) {
            methods.enter(node, parent);
        }

        switch (node.type) {
            case 'Program':
                traverseArray(node.body, node);
                break;

            case 'Parameters':
                traverseArray(node.params, node);
                break;
            
            case 'Block':
                traverseArray(node.body, node);
                break;
            
            case 'NumberLiteral':
            case 'StringLiteral':
            case 'Keyword':
            case 'Name':
                break;

            default:
                throw new TypeError(node.type);
        }

        if (methods && methods.exit) {
            methods.exit(node, parent);
        }
    }

    traverseNode(ast, null);
}

function transform(ast) {
    let newAst = {
        type: 'Program',
        body: [],
    };

    ast._context = newAst.body;

    traverse(ast, {
        NumberLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'NumberLiteral',
                    value: node.value,
                });
            },
        },
        StringLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'StringLiteral',
                    value: node.value,
                });
          },
        },
        Block: {
            enter(node, parent) {
                let expression = {
                    type: 'Block',
                    body: module.body,
                };
                node._context = expression.body;
                parent._context.push(expression);
            },
        },
        Parameters: {
            enter(node, parent) {
                let expression = {
                    type: 'Parameters',
                    params: [],
                };
                node._context = expression.params;
                parent._context.push(expression);
            },
        },
        Keyword: {
            enter(node, parent) {
                if (node.data) {
                    if (node.value === "lang") {
                        parent._context.push({
                            type: "Keyword",
                            value: node.value,
                            data: parseFloat(node.data)
                        });
                        return;
                    }
                    if (node.scope) {
                        parent._context.push({
                            type: "Keyword",
                            value: node.value,
                            data: node.data,
                            scope: node.scope
                        });
                    }
                    parent._context.push({
                        type: "Keyword",
                        value: node.value,
                        data: node.data
                    });
                    return;
                }
                if (!node.data && keywordsWithDataAfter.includes(node.value)) {
                    throw SyntaxError("No data for keyword " + node.value)
                }
                parent._context.push({
                    type: "Keyword",
                    value: node.value
                });
            }
        },
        Name: {
            enter(node, parent) {
                parent._context.push({
                    type: "Name",
                    value: node.value
                });
            }
        }
      });

    return newAst;
}

let foundVersion = false;
function execute(node) {
    switch (node.type) {
        case 'Program':
            return node.body.map(execute)
                .join('\n');
        case 'Keyword':
            if (node.value === "lang") {
                if (!foundVersion) {
                    foundVersion = true;
                    if (!SUPPORTED_VERSIONS.includes(node.data)) {
                        throw VersionError("Incompatible version " + node.data.toString() + " with this interpreter version " + INTERPRETER_VERSION.toString());
                    } else {
                        console.log("LTBLE interpreter version " + INTERPRETER_VERSION.toString());
                        console.log(INTERPRETER_STRING);
                    }
                } else {
                    throw SyntaxError("Found extra version declaration('lang " + node.data.toString() + ";')");
                }
            } else if (node.value === "include") {
                if (node.scope) {
                    include(node.data, node.scope);
                } else {
                    include(node.data, node.data.split(":")[0]);
                }
            }
        default:
            throw new TypeError(node.type);
    }
}

function interpret(code) {
    let tokens = tokenize(code);
    console.log(tokens);
    let ast = parse(tokens);
    console.log(ast);
    let newAst = transform(ast);
    console.log(newAst);
    let output = execute(newAst);

    return output;
}
fs.readFile(args.positionals[0], 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    process.exit(interpret(data));
});