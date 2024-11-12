/*
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview SWC visitor for transforming Scrap's TypeScript code.
 * @copyright Tomáš Wróbel 2024
 */
use swc_core::{
    atoms::Atom,
    common::DUMMY_SP,
    ecma::{
        ast::*,
        visit::{VisitMut, VisitMutWith},
    },
};

use crate::swc_utils::{get_property, get_type, is_property};

pub fn javascript() -> impl VisitMut {
    return JavaScript::default();
}

#[derive(Default)]
pub struct JavaScript;

impl JavaScript {
    fn capitalize_first(&mut self, s: Atom) -> String {
        s.chars()
            .take(1)
            .flat_map(|f| f.to_uppercase())
            .chain(s.chars().skip(1))
            .collect()
    }
}

impl VisitMut for JavaScript {
    fn visit_mut_stmt(&mut self, node: &mut Stmt) {
        node.visit_mut_children_with(self);

        match node {
            Stmt::Decl(Decl::TsInterface(intr)) => {
                let mut stmts: Vec<Stmt> = vec![];

                for item in intr.body.body.iter() {
                    if let TsTypeElement::TsPropertySignature(key) = item {
                        let ts_types = match &key.type_ann {
                            Some(t) => *t.type_ann.clone(),
                            None => continue,
                        };

                        let name = match &*key.key {
                            Expr::Ident(i) => i.sym.to_string(),
                            Expr::Lit(Lit::Str(s)) => s.value.to_string(),
                            _ => continue,
                        };

                        let mut args = vec![ExprOrSpread {
                            spread: None,
                            expr: Box::new(Expr::Lit(Lit::Str(Str {
                                span: DUMMY_SP,
                                value: name.into(),
                                raw: None,
                            }))),
                        }];

                        for ts_type in get_type(&ts_types) {
                            args.push(ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Lit(Lit::Str(Str {
                                    span: DUMMY_SP,
                                    value: ts_type.into(),
                                    raw: None,
                                }))),
                            });
                        }

                        stmts.push(Stmt::Expr(ExprStmt {
                            span: DUMMY_SP,
                            expr: Box::new(Expr::Call(CallExpr {
                                span: DUMMY_SP,
                                callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                                    span: DUMMY_SP,
                                    obj: Box::new(Expr::Ident(Ident {
                                        sym: "self".into(),
                                        optional: false,
                                        ..Default::default()
                                    })),
                                    prop: MemberProp::Ident(IdentName {
                                        span: DUMMY_SP,
                                        sym: "declareVariable".into(),
                                    }),
                                }))),
                                args,
                                type_args: None,
                                ..Default::default()
                            })),
                        }));
                    }
                }

                *node = Stmt::Block(BlockStmt {
                    span: DUMMY_SP,
                    stmts,
                    ..Default::default()
                });
            }

            Stmt::ForIn(ForInStmt { body, .. })
            | Stmt::ForOf(ForOfStmt { body, .. })
            | Stmt::For(ForStmt { body, .. })
            | Stmt::While(WhileStmt { body, .. })
            | Stmt::DoWhile(DoWhileStmt { body, .. }) => {
                let mut stmts: Vec<Stmt> = match *body.clone() {
                    Stmt::Block(block) => block.stmts.clone(),
                    _ => vec![*body.clone()],
                };

                stmts.insert(
                    0,
                    Stmt::Expr(ExprStmt {
                        span: DUMMY_SP,
                        expr: Box::new(Expr::Await(AwaitExpr {
                            span: DUMMY_SP,
                            arg: Box::new(Expr::New(NewExpr {
                                span: DUMMY_SP,
                                callee: Box::new(Expr::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: "Promise".into(),
                                    optional: false,
                                    ..Default::default()
                                })),
                                args: Some(vec![ExprOrSpread {
                                    spread: None,
                                    expr: Box::new(Expr::Member(MemberExpr {
                                        span: DUMMY_SP,
                                        obj: Box::new(Expr::Ident(Ident {
                                            span: DUMMY_SP,
                                            sym: "Scrap".into(),
                                            ..Default::default()
                                        })),
                                        prop: MemberProp::Ident(IdentName {
                                            sym: "loop".into(),
                                            ..Default::default()
                                        }),
                                    })),
                                }]),
                                type_args: None,
                                ..Default::default()
                            })),
                        })),
                    }),
                );

                *body = Box::new(Stmt::Block(BlockStmt {
                    span: DUMMY_SP,
                    stmts,
                    ..Default::default()
                }));
            }

            _ => return,
        }
    }

    fn visit_mut_fn_decl(&mut self, node: &mut FnDecl) {
        node.function.is_async = true;
        node.visit_mut_children_with(self);
    }

    fn visit_mut_expr(&mut self, node: &mut Expr) {
        match node {
            Expr::Call(call) => {
                call.visit_mut_children_with(self);

                if let Callee::Expr(expression) = call.callee.clone() {
                    if let Expr::Ident(id) = *expression {
                        if id.sym != "String" && id.sym != "Number" {
                            call.args.insert(
                                0,
                                ExprOrSpread {
                                    spread: None,
                                    expr: Box::new(Expr::Ident(Ident {
                                        span: DUMMY_SP,
                                        sym: "self".into(),
                                        optional: false,
                                        ..Default::default()
                                    })),
                                },
                            );
                        }
                    }
                }

                *node = Expr::Await(AwaitExpr {
                    span: DUMMY_SP,
                    arg: Box::new(Expr::Call(call.clone())),
                });
            }

            Expr::Assign(assign) => {
                assign.right.visit_mut_children_with(self); // Visit the right side first.

                let left = match &assign.left {
                    AssignTarget::Simple(SimpleAssignTarget::Member(t)) => t,
                    _ => return,
                };

                let argument = match &assign.op {
                    AssignOp::Assign => assign.right.clone(),
                    AssignOp::AddAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::Add,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::SubAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::Sub,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::MulAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::Mul,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::DivAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::Div,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::ModAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::Mod,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::AndAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::LogicalAnd,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::OrAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::LogicalOr,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::BitAndAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::BitAnd,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::BitOrAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::BitOr,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::BitXorAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::BitXor,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::LShiftAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::LShift,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::RShiftAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::RShift,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::ZeroFillRShiftAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::ZeroFillRShift,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::ExpAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::Exp,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                    AssignOp::NullishAssign => Box::new(Expr::Bin(BinExpr {
                        op: BinaryOp::NullishCoalescing,
                        left: Box::new(Expr::Member(left.clone())),
                        right: assign.right.clone(),
                        ..Default::default()
                    })),
                };

                if let Expr::Member(effvar) = *left.clone().obj {
                    if is_property(&effvar, "variables") {
                        *node = Expr::Await(AwaitExpr {
                            span: DUMMY_SP,
                            arg: Box::new(Expr::Call(CallExpr {
                                span: DUMMY_SP,
                                callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                                    span: DUMMY_SP,
                                    obj: effvar.obj.clone(),
                                    prop: MemberProp::Ident(IdentName {
                                        sym: "setVariable".into(),
                                        ..Default::default()
                                    }),
                                }))),
                                args: vec![
                                    ExprOrSpread {
                                        spread: None,
                                        expr: Box::new(Expr::Lit(Lit::Str(Str {
                                            span: DUMMY_SP,
                                            value: match get_property(&left.clone()) {
                                                Some(atom) => atom,
                                                None => return,
                                            },
                                            raw: None,
                                        }))),
                                    },
                                    ExprOrSpread {
                                        spread: None,
                                        expr: argument,
                                    },
                                ],
                                type_args: None,
                                ..Default::default()
                            })),
                        });
                    } else if is_property(&effvar, "effects") {
                        *node = Expr::Await(AwaitExpr {
                            span: DUMMY_SP,
                            arg: Box::new(Expr::Call(CallExpr {
                                span: DUMMY_SP,
                                callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                                    span: DUMMY_SP,
                                    obj: effvar.obj.clone(),
                                    prop: MemberProp::Ident(IdentName {
                                        sym: "setEffect".into(),
                                        ..Default::default()
                                    }),
                                }))),
                                args: vec![
                                    ExprOrSpread {
                                        spread: None,
                                        expr: Box::new(Expr::Lit(Lit::Str(Str {
                                            span: DUMMY_SP,
                                            value: match get_property(&left.clone()) {
                                                Some(atom) => atom,
                                                None => return,
                                            },
                                            raw: None,
                                        }))),
                                    },
                                    ExprOrSpread {
                                        spread: None,
                                        expr: argument,
                                    },
                                ],
                                type_args: None,
                                ..Default::default()
                            })),
                        });
                    }
                } else {
                    match get_property(&left) {
                        Some(atom) => {
                            if atom == "x"
                                || atom == "y"
                                || atom == "draggable"
                                || atom == "volume"
                                || atom == "size"
                                || atom == "penColor"
                                || atom == "penSize"
                            {
                                *node = Expr::Await(AwaitExpr {
                                    span: DUMMY_SP,
                                    arg: Box::new(Expr::Call(CallExpr {
                                        span: DUMMY_SP,
                                        callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                                            span: DUMMY_SP,
                                            obj: left.obj.clone(),
                                            prop: MemberProp::Ident(IdentName {
                                                sym: format!(
                                                    "set{}",
                                                    self.capitalize_first(atom.clone())
                                                )
                                                .into(),
                                                ..Default::default()
                                            }),
                                        }))),
                                        args: vec![
                                            ExprOrSpread {
                                                spread: None,
                                                expr: Box::new(Expr::Lit(Lit::Str(Str {
                                                    span: DUMMY_SP,
                                                    value: atom,
                                                    raw: None,
                                                }))),
                                            },
                                            ExprOrSpread {
                                                spread: None,
                                                expr: argument,
                                            },
                                        ],
                                        type_args: None,
                                        ..Default::default()
                                    })),
                                });
                            } else if atom == "direction" {
                                *node = Expr::Await(AwaitExpr {
                                    span: DUMMY_SP,
                                    arg: Box::new(Expr::Call(CallExpr {
                                        span: DUMMY_SP,
                                        callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                                            span: DUMMY_SP,
                                            obj: left.obj.clone(),
                                            prop: MemberProp::Ident(IdentName {
                                                sym: "pointInDirection".into(),
                                                ..Default::default()
                                            }),
                                        }))),
                                        args: vec![
                                            ExprOrSpread {
                                                spread: None,
                                                expr: Box::new(Expr::Lit(Lit::Str(Str {
                                                    span: DUMMY_SP,
                                                    value: "direction".into(),
                                                    raw: None,
                                                }))),
                                            },
                                            ExprOrSpread {
                                                spread: None,
                                                expr: argument,
                                            },
                                        ],
                                        type_args: None,
                                        ..Default::default()
                                    })),
                                });
                            }
                        }

                        None => return,
                    }
                }
            }

            Expr::Member(member) => {
                member.visit_mut_children_with(self);

                if let Expr::Member(obj) = *member.obj.clone() {
                    let property = get_property(&obj).unwrap_or_default();

                    if property == "variables" || property == "effects" {
                        *node = Expr::Await(AwaitExpr {
                            span: DUMMY_SP,
                            arg: Box::new(Expr::Call(CallExpr {
                                span: DUMMY_SP,
                                callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                                    span: DUMMY_SP,
                                    obj: obj.obj.clone(),
                                    prop: MemberProp::Ident(IdentName {
                                        sym: match property.as_str() {
                                            "variables" => "getVariable".into(),
                                            "effects" => "getEffect".into(),
                                            _ => return,
                                        },
                                        ..Default::default()
                                    }),
                                }))),
                                args: vec![ExprOrSpread {
                                    spread: None,
                                    expr: Box::new(Expr::Lit(Lit::Str(Str {
                                        span: DUMMY_SP,
                                        value: match get_property(&member) {
                                            Some(atom) => atom,
                                            None => return,
                                        },
                                        raw: None,
                                    }))),
                                }],
                                ..Default::default()
                            })),
                        })
                    }
                }
            }

            Expr::Arrow(arrow) => {
                arrow.body.visit_mut_with(self);
                arrow.is_async = true;
            }

            Expr::Fn(fn_expr) => {
                fn_expr.function.body.visit_mut_with(self);
                fn_expr.function.is_async = true;
            }

            _ => return,
        }
    }

    fn visit_mut_catch_clause(&mut self, node: &mut CatchClause) {
        node.body.visit_mut_with(self);

        let param = match &node.param {
            Some(Pat::Ident(id)) => id.id.sym.clone(),
            None => {
                node.param = Some(Pat::Ident(BindingIdent {
                    id: Ident {
                        sym: "__error__".into(),
                        ..Default::default()
                    },
                    type_ann: None,
                }));

                "__error__".into()
            }
            _ => return,
        };

        node.body.stmts.insert(
            0,
            Stmt::If(IfStmt {
                span: DUMMY_SP,
                test: Box::new(Expr::Bin(BinExpr {
                    span: DUMMY_SP,
                    op: BinaryOp::InstanceOf,
                    left: Box::new(Expr::Ident(Ident {
                        span: DUMMY_SP,
                        sym: param.clone(),
                        ..Default::default()
                    })),
                    right: Box::new(Expr::Member(MemberExpr {
                        span: DUMMY_SP,
                        obj: Box::new(Expr::Ident(Ident {
                            sym: "Scrap".into(),
                            ..Default::default()
                        })),
                        prop: MemberProp::Ident(IdentName {
                            sym: "StoopError".into(),
                            ..Default::default()
                        }),
                    })),
                    ..Default::default()
                })),
                cons: Box::new(Stmt::Throw(ThrowStmt {
                    span: DUMMY_SP,
                    arg: Box::new(Expr::Ident(Ident {
                        sym: param.clone(),
                        span: DUMMY_SP,
                        ..Default::default()
                    })),
                })),
                ..Default::default()
            }),
        );
    }
}
