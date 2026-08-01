"use client";

import { Sidebar } from "@/components/Sidebar";
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type Category = {
  id?: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string; // hexadecimal
};

const PRESET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<Category>({
    name: "",
    type: "EXPENSE",
    color: PRESET_COLORS[0]
  });

  const loadCategories = async () => {
    try {
      const data = await fetchApi("/categories");
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setIsEdit(false);
    setFormData({ name: "", type: "EXPENSE", color: PRESET_COLORS[0] });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setIsEdit(true);
    setFormData({ ...cat });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && formData.id) {
        await fetchApi(`/categories/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi(`/categories`, {
          method: "POST",
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar categoria");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      await fetchApi(`/categories/${id}`, { method: "DELETE" });
      loadCategories();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir categoria");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Categorias</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        </header>
        {loading ? (
          <div className="text-center text-muted-foreground py-10">Carregando...</div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-border">Nome</th>
                  <th className="p-4 font-medium border-b border-border">Tipo</th>
                  <th className="p-4 font-medium border-b border-border">Cor</th>
                  <th className="p-4 font-medium border-b border-border text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.type === 'INCOME' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {cat.type === 'INCOME' ? 'RECEITA' : 'DESPESA'}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-muted-foreground font-mono">{cat.color}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => cat.id && handleDelete(cat.id)}
                          className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Nenhuma categoria cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-2xl w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">{isEdit ? "Editar" : "Nova"} Categoria</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "INCOME" | "EXPENSE" })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 p-0 border border-border rounded"
                    />
                    <div className="flex gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className="w-6 h-6 rounded-full border border-border"
                          style={{ backgroundColor: c }}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-blue-600"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
