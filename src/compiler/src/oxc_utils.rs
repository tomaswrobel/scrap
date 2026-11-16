/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * Scrap had used Babel before it introduced Rust, then SWC. Now it uses
 * oxc, which is faster still. This file contains functions for parsing,
 * transforming and extracting variables from TypeScript code.
 *
 * Implementation of these used to live in src/code-transformers directory,
 * where you can still find how JavaScript interacts with Rust.
 *
 * @license MIT
 * @fileoverview WASM entry point
 * @copyright Tomáš Wróbel 2025
 */
use std::path::Path;

use crate::visitor::JavaScript;
use oxc::{
    allocator::Allocator,
    ast::ast::*,
    ast_visit::VisitMut,
    codegen::Codegen,
    parser::Parser,
    semantic::SemanticBuilder,
    span::SourceType,
    transformer::{TransformOptions, Transformer},
};

pub fn get_type(t: &TSType) -> Vec<String> {
    match t {
        TSType::TSNumberKeyword(_) => vec!["number".to_string()],
        TSType::TSBooleanKeyword(_) => vec!["boolean".to_string()],
        TSType::TSStringKeyword(_) => vec!["string".to_string()],
        TSType::TSVoidKeyword(_) => vec!["void".to_string()],
        TSType::TSArrayType(_) => vec!["array".to_string()],
        TSType::TSParenthesizedType(parenthesized) => get_type(&parenthesized.type_annotation),
        TSType::TSUnionType(union) => union.types.iter().flat_map(|t| get_type(t)).collect(),
        TSType::TSTypeReference(reference) => match &reference.type_name {
            TSTypeName::IdentifierReference(id) => vec![id.name.as_str().to_string()],
            _ => vec!["any".to_string()],
        },
        _ => vec!["any".to_string()],
    }
}

/// Names and types of the properties declared by an interface.
pub fn interface_variables(interface: &TSInterfaceDeclaration) -> Vec<(String, Vec<String>)> {
    let mut vars = vec![];

    for member in interface.body.body.iter() {
        if let TSSignature::TSPropertySignature(prop) = member {
            let name = match &prop.key {
                PropertyKey::StaticIdentifier(id) => id.name.as_str(),
                PropertyKey::StringLiteral(lit) => lit.value.as_str(),
                _ => continue,
            };

            let types = match &prop.type_annotation {
                Some(annotation) => get_type(&annotation.type_annotation),
                None => vec!["any".to_string()],
            };

            vars.push((name.to_string(), types));
        }
    }

    vars
}

fn parse_program<'a>(
    allocator: &'a Allocator,
    code: &'a str,
    source_type: SourceType,
) -> Option<Program<'a>> {
    let ret = Parser::new(allocator, code, source_type).parse();

    if ret.panicked || !ret.diagnostics.is_empty() {
        return None;
    }

    Some(ret.program)
}

/// Parses the code into ESTree (TS-ESTree) JSON.
pub fn parse(code: &str) -> Option<String> {
    let allocator = Allocator::default();

    parse_program(&allocator, code, SourceType::ts())
        .map(|program| program.to_estree_json(true, false))
}

pub fn transform(code: &str) -> Option<String> {
    let allocator = Allocator::default();
    let mut program = parse_program(&allocator, code, SourceType::ts().with_script(true))?;

    JavaScript::new(&allocator).visit_program(&mut program);

    // Built after the visitor, so the scopes match the rewritten AST.
    let scoping = SemanticBuilder::new().build(&program).semantic.into_scoping();

    // Strips the types.
    let _ = Transformer::new(&allocator, Path::new("main.ts"), &TransformOptions::default())
        .build_with_scoping(scoping, &mut program);

    Some(Codegen::new().build(&program).code)
}

pub fn get_variables(code: &str) -> Option<Vec<(String, Vec<String>)>> {
    let allocator = Allocator::default();
    let program = parse_program(&allocator, code, SourceType::ts())?;
    let mut vars = vec![];

    for stmt in program.body.iter() {
        if let Statement::TSInterfaceDeclaration(interface) = stmt {
            vars.extend(interface_variables(interface));
        }
    }

    Some(vars)
}
