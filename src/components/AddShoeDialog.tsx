import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateShoe } from '@/hooks/use-shoes';
import { uploadApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SizeGrid from '@/components/SizeGrid';

interface AddShoeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddShoeDialog({ open, onOpenChange }: AddShoeDialogProps) {
  const { t } = useTranslation();
  const createShoe = useCreateShoe();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'men' as 'men' | 'women' | 'kids',
    sizes: [] as string[],
    price: '',
    costPrice: '',
    sku: '',
    description: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('shoes.invalidImageType') || 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(t('shoes.imageTooLarge') || 'Image file is too large. Maximum size is 5MB.');
      e.target.value = ''; // Clear the input
      return;
    }

    setImageFile(file);
    // Clear URL input when file is selected
    setFormData({ ...formData, imageUrl: '' });
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      alert(t('shoes.imagePreviewError') || 'Failed to preview image');
      setImageFile(null);
      setImagePreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sizes.length === 0) {
      alert(t('shoes.addAtLeastOneSize'));
      return;
    }

    let imageUrl = formData.imageUrl;

    // Upload image file if selected
    if (imageFile) {
      setIsUploading(true);
      try {
        const response = await uploadApi.uploadImage(imageFile);
        imageUrl = response.data.imageUrl;
      } catch (error: any) {
        console.error('Image upload failed:', error);
        const errorMessage = error.response?.data?.error || error.message || t('shoes.uploadFailed') || 'Failed to upload image';
        alert(errorMessage);
        setIsUploading(false);
        // Clear the file and preview on error
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      setIsUploading(false);
    }

    await createShoe.mutateAsync({
      ...formData,
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice),
      description: formData.description || undefined,
      imageUrl: imageUrl || undefined,
    });

    // Reset form
    setFormData({
      name: '',
      brand: '',
      category: 'men',
      sizes: [],
      price: '',
      costPrice: '',
      sku: '',
      description: '',
      imageUrl: '',
    });
    setImageFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  const handleSizeToggle = (size: string) => {
    if (formData.sizes.includes(size)) {
      setFormData({
        ...formData,
        sizes: formData.sizes.filter((s) => s !== size),
      });
    } else {
      setFormData({ ...formData, sizes: [...formData.sizes, size] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('shoes.addNewShoe')}</DialogTitle>
          <DialogDescription>{t('shoes.enterDetails')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('shoes.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">{t('shoes.brand')} *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('shoes.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: 'men' | 'women' | 'kids') =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">{t('shoes.men')}</SelectItem>
                    <SelectItem value="women">{t('shoes.women')}</SelectItem>
                    <SelectItem value="kids">{t('shoes.kids')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">{t('shoes.sku')} *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('shoes.salePrice')} *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">{t('shoes.priceInIqd')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">{t('shoes.costPrice')} *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">{t('shoes.costInUsd')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('shoes.sizes')} *</Label>
              <SizeGrid
                selectedSizes={formData.sizes}
                onSizeToggle={handleSizeToggle}
                mode="multi"
              />
              {formData.sizes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('shoes.selectedSizes')}: {formData.sizes.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('shoes.description')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">{t('shoes.imageUrl')}</Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                {t('shoes.imageUploadHint') || 'Accepted formats: JPEG, PNG, WebP. Max size: 5MB'}
              </p>
              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-sm">{t('shoes.uploading') || 'Uploading...'}</div>
                    </div>
                  )}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {t('shoes.or')} {t('shoes.imageUrl')}
              </div>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  // Clear file when URL is entered
                  if (e.target.value) {
                    setImageFile(null);
                    setImagePreview(null);
                  }
                }}
                placeholder="https://example.com/image.jpg"
                disabled={!!imageFile}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createShoe.isPending || isUploading}>
              {(createShoe.isPending || isUploading) ? t('shoes.creating') : t('shoes.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


