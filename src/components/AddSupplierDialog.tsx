import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSupplier } from '@/hooks/use-suppliers';
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

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddSupplierDialog({ open, onOpenChange }: AddSupplierDialogProps) {
  const { t } = useTranslation();
  const createSupplier = useCreateSupplier();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    try {
      await createSupplier.mutateAsync({
        name: name.trim(),
        contact: contact.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setName('');
      setContact('');
      setAddress('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('suppliers.addSupplier')}</DialogTitle>
          <DialogDescription>{t('suppliers.addSupplierDescription')}</DialogDescription>
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
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? t('common.loading') : t('suppliers.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








