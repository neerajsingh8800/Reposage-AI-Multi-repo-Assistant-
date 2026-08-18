"""
AST-aware code chunker for RepoSage.

Instead of splitting files by a fixed number of tokens/lines (which cuts
functions in half and destroys meaning), we parse each file into an AST
using tree-sitter and extract whole semantic units: functions, methods,
and classes. Each chunk carries metadata that later powers hybrid
retrieval and the dependency graph.
"""

from dataclasses import dataclass, field
from pathlib import Path

import tree_sitter_python as tspython
from tree_sitter import Language, Parser

PY_LANGUAGE = Language(tspython.language())


@dataclass
class CodeChunk:
    file_path: str
    chunk_type: str          # "function" | "class" | "method"
    name: str                 # function/class name
    parent_class: str | None  # set if this is a method
    start_line: int
    end_line: int
    code: str
    docstring: str | None = None
    calls: list[str] = field(default_factory=list)  # function names called inside this chunk


def _get_docstring(node, source: bytes) -> str | None:
    body = node.child_by_field_name("body")
    if body is None:
        return None
    for child in body.children:
        if child.type == "expression_statement" and child.children:
            expr = child.children[0]
            if expr.type == "string":
                text = source[expr.start_byte:expr.end_byte].decode("utf-8")
                return text.strip("'\" \n")
    return None


def _get_calls(node, source: bytes) -> list[str]:
    calls = []

    def walk(n):
        if n.type == "call":
            func_node = n.child_by_field_name("function")
            if func_node is not None:
                name = source[func_node.start_byte:func_node.end_byte].decode("utf-8")
                calls.append(name.split(".")[-1])
        for child in n.children:
            walk(child)

    walk(node)
    return calls


def chunk_python_file(file_path: str) -> list[CodeChunk]:
    """Parse a single Python file into function/class/method-level chunks."""
    parser = Parser(PY_LANGUAGE)
    source = Path(file_path).read_bytes()
    tree = parser.parse(source)
    root = tree.root_node

    chunks: list[CodeChunk] = []

    def visit(node, parent_class: str | None = None):
        if node.type == "class_definition":
            name_node = node.child_by_field_name("name")
            class_name = source[name_node.start_byte:name_node.end_byte].decode("utf-8")

            chunks.append(CodeChunk(
                file_path=file_path,
                chunk_type="class",
                name=class_name,
                parent_class=None,
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
                code=source[node.start_byte:node.end_byte].decode("utf-8"),
                docstring=_get_docstring(node, source),
                calls=[],
            ))
            for child in node.children:
                visit(child, parent_class=class_name)

        elif node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            func_name = source[name_node.start_byte:name_node.end_byte].decode("utf-8")

            chunks.append(CodeChunk(
                file_path=file_path,
                chunk_type="method" if parent_class else "function",
                name=func_name,
                parent_class=parent_class,
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
                code=source[node.start_byte:node.end_byte].decode("utf-8"),
                docstring=_get_docstring(node, source),
                calls=_get_calls(node, source),
            ))
        else:
            for child in node.children:
                visit(child, parent_class=parent_class)

    visit(root)
    return chunks


if __name__ == "__main__":
    import sys

    target = sys.argv[1] if len(sys.argv) > 1 else "sample_repo/payments.py"
    result = chunk_python_file(target)

    print(f"\nParsed {len(result)} chunks from {target}\n" + "=" * 60)
    for c in result:
        print(f"\n[{c.chunk_type.upper()}] {c.name}"
              + (f"  (method of {c.parent_class})" if c.parent_class else ""))
        print(f"  lines {c.start_line}-{c.end_line}")
