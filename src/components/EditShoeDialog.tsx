import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateShoe } from '@/hooks/use-shoes';
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
import { Shoe } from '@/lib/api';

interface EditShoeDialogProps {
  shoe: Shoe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditShoeDialog({ shoe, open, onOpenChange }: EditShoeDialogProps) {
  const { t } = useTranslation();
  const updateShoe = useUpdateShoe();
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

  useEffect(() => {
    if (shoe) {
      let sizes: string[] = [];
      try {
        sizes = JSON.parse(shoe.sizes || '[]');
        if (!Array.isArray(sizes)) {
          sizes = [];
        }
      } catch (error) {
        console.error('Error parsing sizes:', error);
        sizes = [];
      }
      
      setFormData({
        name: shoe.name,
        brand: shoe.brand,
        category: shoe.category,
        sizes,
        price: shoe.price.toString(),
        costPrice: shoe.costPrice.toString(),
        sku: shoe.sku,
        description: shoe.description || '',
        imageUrl: shoe.imageUrl || '',
      });
      setImagePreview(shoe.imageUrl || null);
      setImageFile(null);
    }
  }, [shoe]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Clear URL input when file is selected
      setFormData({ ...formData, imageUrl: '' });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        alert(error.response?.data?.error || 'Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    await updateShoe.mutateAsync({
      id: shoe.id,
      data: {
        ...formData,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        description: formData.description || undefined,
        imageUrl: imageUrl || undefined,
      },
    });

    setImageFile(null);
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
          <DialogTitle>{t('shoes.editShoe')}</DialogTitle>
          <DialogDescription>{t('shoes.updateShoeDetails')}</DialogDescription>
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
                accept="image/*"
                onChange={handleImageFileChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
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
                    setImagePreview(e.target.value || shoe.imageUrl || null);
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
            <Button type="submit" disabled={updateShoe.isPending || isUploading}>
              {(updateShoe.isPending || isUploading) ? t('shoes.updating') : t('shoes.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


