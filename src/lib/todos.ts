export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export async function getTodos(): Promise<TodoItem[]> {
  const res = await fetch("/api/admin/todos", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as TodoItem[];
  return Array.isArray(data) ? data : [];
}

export async function addTodo(text: string): Promise<TodoItem | null> {
  const res = await fetch("/api/admin/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.trim() }),
  });
  if (!res.ok) return null;
  return (await res.json()) as TodoItem;
}

export async function toggleTodo(id: string): Promise<TodoItem | null> {
  const res = await fetch(`/api/admin/todos/${id}/toggle`, {
    method: "PUT",
  });
  if (!res.ok) return null;
  return (await res.json()) as TodoItem;
}

export async function deleteTodo(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/todos/${id}`, { method: "DELETE" });
  return res.ok;
}
