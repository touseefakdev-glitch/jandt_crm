import React, { useState, useEffect } from 'react';
import { Customer, CustomerFormInput } from '../../types';
import { Building2, User, Phone, Mail, MapPin, Globe, FileText, Save } from 'lucide-react';
import { localDb } from '../../services/db';
import { Button, Input, Modal, Select, Textarea } from '../ui';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormInput) => void;
  customerToEdit?: Customer | null;
  isSubmitting?: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerToEdit,
  isSubmitting = false,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [route, setRoute] = useState('');
  const [country, setCountry] = useState('USA');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewCode, setPreviewCode] = useState('');

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    if (customerToEdit) {
      setCompanyName(customerToEdit.company_name || '');
      setContactPerson(customerToEdit.contact_person || '');
      setPhone(customerToEdit.phone || '');
      setWhatsappNumber(customerToEdit.whatsapp_number || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setCity(customerToEdit.city || '');
      setRoute(customerToEdit.route || '');
      setCountry(customerToEdit.country || 'USA');
      setNotes(customerToEdit.notes || '');
      setStatus(customerToEdit.status || 'active');
      setPreviewCode(customerToEdit.customer_code);
    } else {
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setWhatsappNumber('');
      setEmail('');
      setAddress('');
      setCity('');
      setRoute('');
      setCountry('USA');
      setNotes('');
      setStatus('active');
      setPreviewCode(localDb.generateCustomerCode());
    }
    setErrors({});
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!companyName.trim()) {
      errs.companyName = 'Company name is required.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      company_name: companyName,
      contact_person: contactPerson,
      phone,
      whatsapp_number: whatsappNumber,
      email,
      address,
      city,
      route,
      country,
      notes,
      status,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditMode ? 'Edit Customer Record' : 'Create New Customer'}
      subtitle={
        <>
          System Code: <span className="font-bold text-brand-600">{previewCode}</span>
        </>
      }
      icon={
        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Company Name *"
              required
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: '' }));
              }}
              placeholder="e.g. Apex Industrial Supplies"
              icon={<Building2 className="w-4 h-4" />}
              error={errors.companyName}
            />
          </div>
          <Select label="Account Status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Robert Carter"
            icon={<User className="w-4 h-4" />}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 03001234567"
            icon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="WhatsApp Number"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 03001234567"
            icon={<Phone className="w-4 h-4 text-emerald-600" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="robert@apexind.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email}
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Peshawar"
            icon={<MapPin className="w-4 h-4" />}
          />
          <Input
            label="Route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="e.g. Route 1"
            icon={<MapPin className="w-4 h-4" />}
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="USA"
            icon={<Globe className="w-4 h-4" />}
          />
        </div>

        <Input label="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 100 Industrial Parkway, Suite 400" />

        <Textarea
          label="Internal Customer Notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add operational notes, special delivery instructions, account terms..."
        />

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} icon={<Save className="w-4 h-4" />}>
            {isEditMode ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
