/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview oxc visitor for transforming Scrap's TypeScript code.
 * @copyright Tomáš Wróbel 2025
 */
use oxc::{
    allocator::{Allocator, ArenaVec, CloneIn, GetAllocator, IntoIn, TakeIn},
    ast::{ast::*, builder::AstBuilder},
    ast_visit::{VisitMut, walk_mut},
    span::SPAN,
};

use crate::oxc_utils::interface_variables;

pub struct JavaScript<'a> {
    ast: AstBuilder<'a>,
}

impl<'a> JavaScript<'a> {
    pub fn new(allocator: &'a Allocator) -> Self {
        Self {
            ast: AstBuilder::new(allocator),
        }
    }

    fn string(&self, value: &str) -> Argument<'a> {
        Argument::new_string_literal(SPAN, Str::from_str_in(value, &self.ast), None, &self.ast)
    }

    fn identifier(&self, name: impl Into<Ident<'a>>) -> Expression<'a> {
        Expression::new_identifier(SPAN, name, &self.ast)
    }

    /// `object.property`
    fn member(&self, object: Expression<'a>, property: &str) -> Expression<'a> {
        let property = IdentifierName::new(SPAN, Ident::from_str_in(property, &self.ast), &self.ast);

        Expression::new_static_member_expression(SPAN, object, property, false, &self.ast)
    }

    /// `object.method(...arguments)`
    fn call(
        &self,
        object: Expression<'a>,
        method: &str,
        arguments: impl IntoIn<'a, ArenaVec<'a, Argument<'a>>>,
    ) -> Expression<'a> {
        let callee = self.member(object, method);

        Expression::new_call_expression(SPAN, callee, None, arguments, false, &self.ast)
    }

    fn awaited(&self, expression: Expression<'a>) -> Expression<'a> {
        Expression::new_await_expression(SPAN, expression, &self.ast)
    }

    /// The engine has no property setters, so `self.x += 1` and alike
    /// become `await self.setX(await self.x + 1)`.
    fn setter(&self, assign: &mut AssignmentExpression<'a>) -> Option<Expression<'a>> {
        let allocator = self.ast.allocator();
        let left = assign.left.as_member_expression()?;
        let name = left.static_property_name();

        let (target, method, current, key) =
            if let Some(inner) = left.object().as_member_expression() {
                let (set, get) = match inner.static_property_name() {
                    Some("variables") => ("setVariable", "getVariable"),
                    Some("effects") => ("setEffect", "getEffect"),
                    _ => return None,
                };

                let name = name?;
                let target = inner.object();
                let current =
                    self.awaited(self.call(target.clone_in(allocator), get, [self.string(name)]));

                (target.clone_in(allocator), set.to_string(), current, Some(self.string(name)))
            } else {
                let name = name?;

                let method = match name {
                    "x" | "y" | "draggable" | "volume" | "size" | "penColor" | "penSize" => {
                        format!("set{}{}", name[..1].to_uppercase(), &name[1..])
                    }
                    "direction" => "pointInDirection".to_string(),
                    _ => return None,
                };

                let target = left.object();
                let current = self.awaited(self.member(target.clone_in(allocator), name));

                (target.clone_in(allocator), method, current, None)
            };

        let right = assign.right.take_in(&self.ast);

        let value = if let Some(operator) = assign.operator.to_binary_operator() {
            Expression::new_binary_expression(SPAN, current, operator, right, &self.ast)
        } else if let Some(operator) = assign.operator.to_logical_operator() {
            Expression::new_logical_expression(SPAN, current, operator, right, &self.ast)
        } else {
            right
        };

        let mut arguments = ArenaVec::new_in(&self.ast);

        if let Some(key) = key {
            arguments.push(key);
        }

        arguments.push(Argument::from(value));

        Some(self.awaited(self.call(target, &method, arguments)))
    }
}

impl<'a> VisitMut<'a> for JavaScript<'a> {
    fn visit_statement(&mut self, node: &mut Statement<'a>) {
        walk_mut::walk_statement(self, node);

        let body = match node {
            Statement::TSInterfaceDeclaration(interface) => {
                let mut stmts = ArenaVec::new_in(&self.ast);

                for (name, types) in interface_variables(interface) {
                    let mut arguments = ArenaVec::new_in(&self.ast);
                    arguments.push(self.string(&name));

                    for ts_type in types {
                        arguments.push(self.string(&ts_type));
                    }

                    let call = self.call(self.identifier("self"), "declareVariable", arguments);
                    stmts.push(Statement::new_expression_statement(SPAN, call, &self.ast));
                }

                *node = Statement::new_block_statement(SPAN, stmts, &self.ast);
                return;
            }

            Statement::FunctionDeclaration(function) => {
                function.r#async = true;
                return;
            }

            Statement::ForInStatement(stmt) => &mut stmt.body,
            Statement::ForOfStatement(stmt) => &mut stmt.body,
            Statement::ForStatement(stmt) => &mut stmt.body,
            Statement::WhileStatement(stmt) => &mut stmt.body,
            Statement::DoWhileStatement(stmt) => &mut stmt.body,

            _ => return,
        };

        // Every iteration yields to the engine: `await new Promise(Scrap.loop);`
        let tick = self.member(self.identifier("Scrap"), "loop");
        let tick = Expression::new_new_expression(
            SPAN,
            self.identifier("Promise"),
            None,
            [Argument::from(tick)],
            &self.ast,
        );
        let tick = Statement::new_expression_statement(SPAN, self.awaited(tick), &self.ast);

        if let Statement::BlockStatement(block) = body {
            block.body.insert(0, tick);
        } else {
            let stmt = body.take_in(&self.ast);
            *body = Statement::new_block_statement(SPAN, [tick, stmt], &self.ast);
        }
    }

    fn visit_expression(&mut self, node: &mut Expression<'a>) {
        match node {
            Expression::AssignmentExpression(assign) => {
                // Only the right side: the left one would turn into a getter call.
                self.visit_expression(&mut assign.right);

                if let Some(setter) = self.setter(assign) {
                    *node = setter;
                }

                return;
            }

            _ => walk_mut::walk_expression(self, node),
        }

        match node {
            Expression::CallExpression(call) => {
                if let Expression::Identifier(id) = &call.callee {
                    if id.name != "String" && id.name != "Number" {
                        call.arguments.insert(0, Argument::from(self.identifier("self")));
                    }
                }

                // Event callbacks get their own `self`, so the engine
                // can tell scripts apart (e.g. for `stopOtherScripts`).
                let is_event = call.callee.as_member_expression().is_some_and(|member| {
                    matches!(member.object(), Expression::Identifier(obj) if obj.name == "self")
                        && member
                            .static_property_name()
                            .is_some_and(|property| property.starts_with("when"))
                });

                if is_event {
                    let params = match call.arguments.last_mut() {
                        Some(Argument::ArrowFunctionExpression(arrow)) => Some(&mut arrow.params),
                        Some(Argument::FunctionExpression(function)) => Some(&mut function.params),
                        _ => None,
                    };

                    if let Some(params) = params.filter(|params| params.items.is_empty()) {
                        let pattern =
                            BindingPattern::new_binding_identifier(SPAN, "self", &self.ast);

                        params.items.push(FormalParameter::new(
                            SPAN,
                            ArenaVec::new_in(&self.ast),
                            pattern,
                            None,
                            None,
                            false,
                            None,
                            false,
                            false,
                            &self.ast,
                        ));
                    }
                }

                let call = node.take_in(&self.ast);
                *node = self.awaited(call);
            }

            Expression::ArrowFunctionExpression(arrow) => arrow.r#async = true,
            Expression::FunctionExpression(function) => function.r#async = true,

            _ => {
                let Some(member) = node.as_member_expression() else {
                    return;
                };

                let Some(inner) = member.object().as_member_expression() else {
                    return;
                };

                let method = match inner.static_property_name() {
                    Some("variables") => "getVariable",
                    Some("effects") => "getEffect",
                    _ => return,
                };

                let Some(name) = member.static_property_name() else {
                    return;
                };

                let target = inner.object().clone_in(self.ast.allocator());
                *node = self.awaited(self.call(target, method, [self.string(name)]));
            }
        }
    }

    fn visit_catch_clause(&mut self, node: &mut CatchClause<'a>) {
        walk_mut::walk_catch_clause(self, node);

        let param: Ident<'a> = match &node.param {
            Some(CatchParameter {
                pattern: BindingPattern::BindingIdentifier(id),
                ..
            }) => id.name,

            None => {
                let pattern = BindingPattern::new_binding_identifier(SPAN, "__error__", &self.ast);
                node.param = Some(CatchParameter::new(SPAN, pattern, None, &self.ast));

                "__error__".into()
            }

            _ => return,
        };

        // Stopping a script must not be swallowed by user's `catch`.
        let test = Expression::new_binary_expression(
            SPAN,
            self.identifier(param),
            BinaryOperator::Instanceof,
            self.member(self.identifier("Scrap"), "StoopError"),
            &self.ast,
        );

        let rethrow = Statement::new_throw_statement(SPAN, self.identifier(param), &self.ast);

        node.body
            .body
            .insert(0, Statement::new_if_statement(SPAN, test, rethrow, None, &self.ast));
    }
}
