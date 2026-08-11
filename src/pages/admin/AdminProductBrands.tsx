import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { ProductBrand } from '../../types';
import { Bookmark, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';

export const AdminProductBrands: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brands = useMemo(() => localDb.getProductBrands(), [refreshKey]);
  const products = useMemo(() => localDb.getProducts(), [refreshKey]);

  if (!user) return null;

  const handleOpenModal = (b?: ProductBrand) => {
    if (b) {
      setEditingBrand(b);
      setName(b.name);
      setDescription(b.description || '');
      setIsActive(b.is_active);
    } else {
      setEditingBrand(null);
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
      setError('Brand name is required.');
      return;
    }

    if (editingBrand) {
      localDb.updateProductBrand(editingBrand.id, { name: name.trim(), description: description.trim(), is_active: isActive }, user.id);
    } else {
      localDb.addProductBrand({ name: name.trim(), description: description.trim(), is_active: isActive }, user.id);
    }

    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleToggleStatus = (b: ProductBrand) => {
    localDb.updateProductBrand(b.id, { is_active: !b.is_active }, user.id);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Brands"
        description="Manage supply manufacturer brands (e.g. J&T ProPack, J&T Secure, J&T Industrial)"
        icon={<Bookmark className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        actions={
          <Button variant="secondary" icon={<Plus className="w-4 h-4 text-sky-400" />} onClick={() => handleOpenModal()}>
            Add Product Brand
          </Button>
        }
      />

      <Card flush>
        <Table minWidth={1020}>
          <THead>
            <Tr hover={false}>
              <Th width={240}>Brand Name</Th>
              <Th width={300}>Description</Th>
              <Th width={150}>Catalog Products</Th>
              <Th width={130}>Status</Th>
              <Th width={150} align="right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {brands.length > 0 ? (
              brands.map((b) => {
                const productCount = products.filter(p => p.brand_id === b.id).length;
                return (
                  <Tr key={b.id}>
                    <Td width={240} truncate maxWidth={240}>
                      <span className="inline-flex items-center gap-2 font-bold text-slate-900">
                        <Bookmark className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">{b.name}</span>
                      </span>
                    </Td>
                    <Td width={300} truncate maxWidth={300} className="text-slate-600">
                      {b.description || <span className="italic text-slate-400">No description</span>}
                    </Td>
                    <Td width={150} className="font-bold text-slate-900 font-mono">{productCount} product(s)</Td>
                    <Td width={130}>
                      {b.is_active ? (
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
                    <Td width={150} align="right" className="whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(b)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={b.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => handleToggleStatus(b)}
                        >
                          {b.is_active ? 'Deactivate' : 'Activate'}
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
                    icon={<Bookmark className="w-6 h-6" />}
                    title="No product brands"
                    description="Add your first manufacturer brand to label catalog items."
                    action={
                      <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
                        Add Product Brand
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
        title={editingBrand ? 'Edit Product Brand' : 'Add Product Brand'}
        subtitle="Manufacturer or supply brand label"
        icon={
          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={
              <>
                Brand Name <span className="text-red-500">*</span>
              </>
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. J&T ProPack, J&T Secure"
            error={error}
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brand description..."
            rows={2}
            className="resize-none min-h-[64px]"
          />

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="brandActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="brandActive" className="text-sm font-medium text-slate-800">
              Brand Active
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              Save Product Brand
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
