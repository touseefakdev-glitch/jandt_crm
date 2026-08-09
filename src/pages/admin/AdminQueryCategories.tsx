import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { QueryCategory } from '../../types';
import { Tag, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';

export const AdminQueryCategories: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QueryCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => localDb.getCategories(), [refreshKey]);
  const queries = useMemo(() => localDb.getQueries(), [refreshKey]);

  if (!user) return null;

  const handleOpenModal = (cat?: QueryCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setDescription(cat.description || '');
      setIsActive(cat.is_active);
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    if (editingCategory) {
      localDb.updateQueryCategory(editingCategory.id, { name: name.trim(), description: description.trim(), is_active: isActive }, user.id);
    } else {
      localDb.addQueryCategory({ name: name.trim(), description: description.trim(), is_active: isActive }, user.id);
    }

    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleToggleStatus = (cat: QueryCategory) => {
    localDb.updateQueryCategory(cat.id, { is_active: !cat.is_active }, user.id);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Query Categories"
        description="Manage issue categories for support ticket classification and reporting"
        icon={<Tag className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        actions={
          <Button variant="secondary" icon={<Plus className="w-4 h-4 text-sky-400" />} onClick={() => handleOpenModal()}>
            Add Query Category
          </Button>
        }
      />

      <Card>
        <Table>
          <THead>
            <Tr hover={false}>
              <Th>Category Name</Th>
              <Th>Description</Th>
              <Th>Linked Queries</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {categories.length > 0 ? (
              categories.map((cat) => {
                const queryCount = queries.filter(q => q.category_id === cat.id).length;
                return (
                  <Tr key={cat.id}>
                    <Td>
                      <span className="inline-flex items-center gap-2 font-bold text-slate-900">
                        <Tag className="w-4 h-4 text-sky-600 shrink-0" />
                        {cat.name}
                      </span>
                    </Td>
                    <Td className="text-slate-600 max-w-xs whitespace-normal">
                      {cat.description || <span className="italic text-slate-400">No description</span>}
                    </Td>
                    <Td className="font-bold text-slate-900 font-mono">{queryCount} ticket(s)</Td>
                    <Td>
                      {cat.is_active ? (
                        <Badge
                          badge={{
                            subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                            solid: 'bg-emerald-600 text-white',
                            dot: 'bg-emerald-500',
                            label: 'Active',
                          }}
                        />
                      ) : (
                        <Badge
                          badge={{
                            subtle: 'bg-red-50 text-red-700 ring-red-200',
                            solid: 'bg-red-600 text-white',
                            dot: 'bg-red-500',
                            label: 'Inactive',
                          }}
                        />
                      )}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(cat)}>
                          Edit
                        </Button>
                        <Button
                          variant={cat.is_active ? 'ghost' : 'ghost'}
                          size="sm"
                          className={cat.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => handleToggleStatus(cat)}
                        >
                          {cat.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr hover={false}>
                <Td colSpan={5} className="p-0">
                  <EmptyState
                    icon={<Tag className="w-6 h-6" />}
                    title="No query categories"
                    description="Add your first query category to classify support tickets."
                    action={
                      <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
                        Add Query Category
                      </Button>
                    }
                  />
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="sm"
        title={editingCategory ? 'Edit Query Category' : 'Add Query Category'}
        subtitle="Used for support ticket classification and reporting"
        icon={
          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={
              <>
                Category Name <span className="text-red-500">*</span>
              </>
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Order Delivery, Invoice Query"
            error={error}
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe when this category should be selected..."
            rows={2}
            className="resize-none min-h-[64px]"
          />

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="catActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="catActive" className="text-sm font-medium text-slate-800">
              Category Active
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
