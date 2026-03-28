from __future__ import annotations

from importlib import import_module
from pathlib import Path
from typing import Iterable
import sys

import click


WEB_ROOT = Path(__file__).resolve().parent
COMMANDS_DIR = WEB_ROOT / "src" / "management" / "commands"


def _ensure_web_on_path() -> None:
    web_root = str(WEB_ROOT)
    if web_root not in sys.path:
        sys.path.insert(0, web_root)


def _load_commands() -> Iterable[click.Command]:
    """Dynamically discover and load all command modules."""
    if not COMMANDS_DIR.exists():
        return
    
    for module_path in COMMANDS_DIR.glob("*.py"):
        if module_path.name.startswith("_"):
            continue
        
        module_name = f"src.management.commands.{module_path.stem}"
        try:
            module = import_module(module_name)
            if hasattr(module, "command"):
                yield module.command
        except (ImportError, AttributeError):
            pass


def _build_cli() -> click.Group:
    @click.group(help="Project management commands.")
    def cli() -> None:
        pass

    for command in _load_commands():
        cli.add_command(command)

    return cli


def main() -> None:
    _ensure_web_on_path()
    cli = _build_cli()
    cli()


if __name__ == "__main__":
    main()
