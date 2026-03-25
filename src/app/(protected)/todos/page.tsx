"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  type TodoItem,
} from "@/lib/todos";
import { Trash2, ListTodo } from "lucide-react";

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

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getTodos()
      .then(setTodos)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

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

  const handleDelete = async (id: string) => {
    const ok = await deleteTodo(id);
    if (ok) refresh();
  };

  const incomplete = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ListTodo className="h-6 w-6" />
          Todos
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your tasks. Access this page from the todo widget in the top bar.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All todos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Add a new todo..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit">Add</Button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="space-y-4">
              {incomplete.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    To do ({incomplete.length})
                  </h3>
                  <ul className="space-y-2">
                    {incomplete.map((todo) => (
                      <TodoRow
                        key={todo.id}
                        todo={todo}
                        onToggle={() => handleToggle(todo.id)}
                        onDelete={() => handleDelete(todo.id)}
                        formatDate={formatTodoDateTime}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {completed.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Completed ({completed.length})
                  </h3>
                  <ul className="space-y-2">
                    {completed.map((todo) => (
                      <TodoRow
                        key={todo.id}
                        todo={todo}
                        onToggle={() => handleToggle(todo.id)}
                        onDelete={() => handleDelete(todo.id)}
                        formatDate={formatTodoDateTime}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {todos.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No todos yet. Add one above.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
  formatDate,
}: {
  todo: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
  formatDate: (createdAt: string) => string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border px-4 py-3 hover:bg-muted/40 group">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={onToggle}
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <span
          className={`block ${
            todo.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.text}
        </span>
        {todo.createdAt && (
          <span className="text-[10px] text-muted-foreground">
            {formatDate(todo.createdAt)}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </li>
  );
}
