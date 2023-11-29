'use strict';

let keywords = [
    "include",
    "lang",
    "program",
    "on",
    "in",
    "of"
];

function tokenize(code) {
    let cursor = 0;

    let tokens = [];

    while (current < code.length) {
        let char = code[current];

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

        let WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }
    }
}

function parse(tokens) {

}

function traverse(ast, visitor) {

}

function transform(ast) {

}

function execute(node) {

}

function interpret(code) {
    let tokens = tokenize(code);
    let ast = parse(tokens);
    let newAst = transform(ast);
    let output = execute(newAst);

    return output;
}