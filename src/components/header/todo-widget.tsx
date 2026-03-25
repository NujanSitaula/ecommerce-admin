"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ListTodo, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  type TodoItem,
} from "@/lib/todos";

const MAX_ITEMS = 5;

function formatTodoDateTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    const dateStr = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  } catch {
    return "";
  }
}

export function TodoWidget() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const refresh = () => getTodos().then(setTodos);
  const incompleteCount = todos.filter((t) => !t.completed).length;

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    const added = await addTodo(text);
    if (added) {
      setNewText("");
      refresh();
    }
  };

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
    refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deleteTodo(id);
    if (ok) refresh();
  };

  const displayedTodos = todos
    .filter((t) => !t.completed)
    .concat(todos.filter((t) => t.completed))
    .slice(0, MAX_ITEMS);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <ListTodo className="h-4 w-4" />
              {incompleteCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {incompleteCount > 9 ? "9+" : incompleteCount}
                </span>
              )}
              <span className="sr-only">Todos</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Todos</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3">
          <h3 className="text-sm font-medium mb-3">Todos</h3>
          <form onSubmit={handleAdd} className="flex gap-2 mb-3">
            <Input
              placeholder="Add todo..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm" className="h-8 shrink-0">
              Add
            </Button>
          </form>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {displayedTodos.length === 0 ? (
              <li className="text-sm text-muted-foreground py-4 text-center">
                No todos yet
              </li>
            ) : (
              displayedTodos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 hover:bg-muted/60 group"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggle(todo.id)}
                      className="shrink-0"
                    />
                    <span
                      className={`flex-1 text-sm truncate ${
                        todo.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(todo.id, e)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  {todo.createdAt && (
                    <span className="text-[10px] text-muted-foreground ml-6">
                      {formatTodoDateTime(todo.createdAt)}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="border-t px-3 py-2">
          <Link
            href="/todos"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open full todos
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
