'use strict';

function tokenize(code) {

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