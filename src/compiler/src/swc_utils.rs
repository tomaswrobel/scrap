/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * Scrap had used Babel before it introduced Rust. Now it uses SWC.
 * SWC is up to 20 times faster than Babel and is written in Rust, which
 * suits Scrap's Rust-based backend. This file contains functions for
 * parsing, transforming and extracting variables from TypeScript code.
 *
 * Implementation of these used to live in src/code-transformers directory,
 * where you can still find how JavaScript interacts with Rust.
 *
 * @license MIT
 * @fileoverview WASM entry point
 * @copyright Tomáš Wróbel 2025
 */
use crate::visitor::javascript;
use swc_core::{
    atoms::Atom,
    common::{FileName, FilePathMapping, GLOBALS, SourceMap, errors::Handler, sync::Lrc},
    ecma::{
        ast::*,
        parser::{Parser, StringInput, Syntax, TsSyntax, lexer::Lexer},
        transforms::typescript::strip_type,
        visit::VisitMutWith,
    },
};

use swc::{Compiler, PrintArgs, config::IsModule};

pub fn get_type(t: &TsType) -> Vec<String> {
    match t {
        TsType::TsKeywordType(keyword) => {
            vec![match keyword.kind {
                TsKeywordTypeKind::TsNumberKeyword => "number".to_string(),
                TsKeywordTypeKind::TsBooleanKeyword => "boolean".to_string(),
                TsKeywordTypeKind::TsStringKeyword => "string".to_string(),
                TsKeywordTypeKind::TsVoidKeyword => "void".to_string(),
                _ => "any".to_string(),
            }]
        }
        TsType::TsArrayType(_) => vec!["array".to_string()],
        TsType::TsParenthesizedType(span) => get_type(&span.type_ann),
        TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsUnionType(union)) => {
            let mut types: Vec<String> = vec![];

            for type_ann in union.types.iter() {
                types.extend(get_type(type_ann));
            }

            return types;
        }
        TsType::TsTypeRef(i) => match &i.type_name {
            TsEntityName::Ident(i) => vec![i.sym.to_string()],
            _ => vec!["any".to_string()],
        },
        _ => vec!["any".to_string()],
    }
}

pub fn is_property(node: &MemberExpr, str: &str) -> bool {
    match &node.prop {
        MemberProp::Ident(id) => id.sym == str,

        MemberProp::Computed(c) => {
            if let Expr::Lit(Lit::Str(s)) = &*c.expr {
                s.value == str
            } else {
                false
            }
        }

        _ => false,
    }
}

pub fn get_property(node: &MemberExpr) -> Option<Atom> {
    match &node.prop {
        MemberProp::Ident(id) => Some(id.sym.clone()),

        MemberProp::Computed(c) => {
            if let Expr::Lit(Lit::Str(s)) = &*c.expr {
                Some(s.value.clone())
            } else {
                None
            }
        }

        MemberProp::PrivateName(_) => None,
    }
}

pub fn parse(code: String) -> Result<Module, ()> {
    let cm = Lrc::new(SourceMap::new(FilePathMapping::empty()));
    let fm = cm.new_source_file(FileName::Custom("main.ts".into()).into(), code);

    let lexer = Lexer::new(
        Syntax::Typescript(TsSyntax {
            decorators: false,
            tsx: false,
            dts: false,
            no_early_errors: true,
            disallow_ambiguous_jsx_like: false,
        }),
        EsVersion::Es2015,
        StringInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);

    if parser.take_errors().len() > 0 {
        return Err(());
    }

    return parser.parse_module().map_err(|_| ());
}

pub fn transform(code: String) -> Result<String, anyhow::Error> {
    let cm = Lrc::new(SourceMap::new(FilePathMapping::empty()));
    let compiler = Compiler::new(cm.clone());

    let source = cm.new_source_file(FileName::Custom("main.ts".to_string()).into(), code);

    let handler =
        Handler::with_emitter_writer(Box::new(std::io::stderr()), Some(compiler.cm.clone()));

    return GLOBALS.set(&Default::default(), || {
        let program = compiler.parse_js(
            source,
            &handler,
            EsVersion::Es2015,
            Syntax::Typescript(TsSyntax {
                decorators: false,
                tsx: false,
                dts: false,
                no_early_errors: true,
                disallow_ambiguous_jsx_like: false,
            }),
            IsModule::Bool(false),
            Some(compiler.comments()),
        );

        match program {
            Ok(mut program) => {
                program.visit_mut_with(&mut javascript());
                program.visit_mut_with(&mut strip_type());

                match compiler.print(&program, PrintArgs::default()) {
                    Ok(s) => Ok(s.code),
                    Err(e) => Err(e),
                }
            }
            Err(e) => Err(e),
        }
    });
}

pub fn get_variables(code: String) -> Result<Vec<(String, Vec<String>)>, ()> {
    let parsed = parse(code);

    if let Ok(parsed) = parsed {
        let mut vars: Vec<(String, Vec<String>)> = vec![];

        for stmt in parsed.body.iter() {
            if let ModuleItem::Stmt(Stmt::Decl(Decl::TsInterface(interface))) = stmt {
                for member in interface.body.body.iter() {
                    if let TsTypeElement::TsPropertySignature(prop) = member {
                        let name = match *prop.key.clone() {
                            Expr::Ident(ident) => ident.sym.to_string(),
                            Expr::Lit(Lit::Str(str)) => str.value.to_string(),
                            _ => continue,
                        };

                        let type_arr = match prop.type_ann.clone() {
                            Some(type_ann) => get_type(&type_ann.type_ann),
                            None => vec!["any".to_string()],
                        };

                        vars.push((name, type_arr));
                    }
                }
            }
        }

        return Ok(vars);
    }
    return Err(());
}
