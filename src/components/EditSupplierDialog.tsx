import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateSupplier } from '@/hooks/use-suppliers';
import { Supplier } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditSupplierDialogProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditSupplierDialog({ supplier, open, onOpenChange }: EditSupplierDialogProps) {
  const { t } = useTranslation();
  const updateSupplier = useUpdateSupplier();
  const [name, setName] = useState(supplier.name);
  const [contact, setContact] = useState(supplier.contact || '');
  const [address, setAddress] = useState(supplier.address || '');
  const [notes, setNotes] = useState(supplier.notes || '');

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContact(supplier.contact || '');
      setAddress(supplier.address || '');
      setNotes(supplier.notes || '');
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    try {
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: {
          name: name.trim(),
          contact: contact.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('suppliers.editSupplier')}</DialogTitle>
          <DialogDescription>{t('suppliers.editSupplierDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('suppliers.name')} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('suppliers.namePlaceholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact">{t('suppliers.contact')}</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t('suppliers.contactPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="address">{t('suppliers.address')}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('suppliers.addressPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('suppliers.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('suppliers.notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateSupplier.isPending}>
              {updateSupplier.isPending ? t('common.loading') : t('suppliers.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








