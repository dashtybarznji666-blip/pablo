import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useShoes, useDeleteShoe } from '@/hooks/use-shoes';
import { useLowStock } from '@/hooks/use-stock';
import { useExchangeRate } from '@/hooks/use-exchange-rate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Package, Search, Grid3x3, Table2, Download, FileText, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AddShoeDialog from '@/components/AddShoeDialog';
import EditShoeDialog from '@/components/EditShoeDialog';
import { Shoe } from '@/lib/api';

const categoryMap: Record<string, string> = {
  men: 'shoes.men',
  women: 'shoes.women',
  kids: 'shoes.kids',
};

type ViewMode = 'grid' | 'table';
type SortOption = 'name-asc' | 'name-desc' | 'brand-asc' | 'brand-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'default';
type StockStatus = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export default function Shoes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: shoes, isLoading } = useShoes();
  const { data: lowStock } = useLowStock(3);
  const { data: exchangeRate } = useExchangeRate();
  const deleteShoe = useDeleteShoe();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editShoe, setEditShoe] = useState<Shoe | null>(null);
  const [deleteShoeId, setDeleteShoeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<StockStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Get unique brands from shoes
  const brands = useMemo(() => {
    if (!shoes) return [];
    return Array.from(new Set(shoes.map(s => s.brand))).sort();
  }, [shoes]);

  // Get low stock shoe IDs
  const lowStockShoeIds = useMemo(() => {
    if (!lowStock) return new Set<string>();
    return new Set(lowStock.map(s => s.shoeId));
  }, [lowStock]);

  // Filter and sort shoes
  const filteredAndSortedShoes = useMemo(() => {
    if (!shoes) return [];

    let filtered = shoes.filter((shoe) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        shoe.name.toLowerCase().includes(searchLower) ||
        shoe.brand.toLowerCase().includes(searchLower) ||
        shoe.sku.toLowerCase().includes(searchLower) ||
        shoe.description?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = filterCategory === 'all' || shoe.category === filterCategory;

      // Brand filter
      const matchesBrand = filterBrand === 'all' || shoe.brand === filterBrand;

      // Stock status filter
      const totalStock = shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
      const isLowStock = lowStockShoeIds.has(shoe.id);
      let matchesStockStatus = true;
      if (filterStockStatus === 'in-stock') {
        matchesStockStatus = totalStock > 10;
      } else if (filterStockStatus === 'low-stock') {
        matchesStockStatus = isLowStock && totalStock > 0;
      } else if (filterStockStatus === 'out-of-stock') {
        matchesStockStatus = totalStock === 0;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesStockStatus;
    });

    // Sort
    if (sortOption !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        const totalStockA = a.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
        const totalStockB = b.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;

        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'brand-asc':
            return a.brand.localeCompare(b.brand);
          case 'brand-desc':
            return b.brand.localeCompare(a.brand);
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'stock-asc':
            return totalStockA - totalStockB;
          case 'stock-desc':
            return totalStockB - totalStockA;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [shoes, searchQuery, filterCategory, filterBrand, filterStockStatus, sortOption, lowStockShoeIds]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!shoes) return { totalShoes: 0, totalStockValue: 0, byCategory: {}, averagePrice: 0 };
    
    const byCategory: Record<string, number> = {};
    let totalStockValue = 0;
    let totalPrice = 0;

    shoes.forEach((shoe) => {
      byCategory[shoe.category] = (byCategory[shoe.category] || 0) + 1;
      const stockValue = (shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0) * shoe.price;
      totalStockValue += stockValue;
      totalPrice += shoe.price;
    });

    return {
      totalShoes: shoes.length,
      totalStockValue,
      byCategory,
      averagePrice: shoes.length > 0 ? totalPrice / shoes.length : 0,
    };
  }, [shoes]);

  // Export to Excel
  const handleExport = () => {
    if (!filteredAndSortedShoes || filteredAndSortedShoes.length === 0) return;

    const headers = [
      t('shoes.name'),
      t('shoes.brand'),
      t('shoes.category'),
      t('shoes.sku'),
      t('shoes.price'),
      t('shoes.cost'),
      t('shoes.stock'),
      t('shoes.sizes'),
    ];
    
    const rows = filteredAndSortedShoes.map((shoe) => {
      let sizes: string[] = [];
      try {
        const sizesStr = (shoe.sizes || '').trim();
        if (sizesStr) {
          const parsed = JSON.parse(sizesStr);
          if (Array.isArray(parsed)) {
            sizes = parsed.map((s: any) => String(s));
          }
        }
      } catch (error) {
        sizes = [];
      }
      const totalStock = shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;

      return [
        shoe.name,
        shoe.brand,
        t(categoryMap[shoe.category] || shoe.category),
        shoe.sku,
        shoe.price,
        shoe.costPrice,
        totalStock,
        sizes.join(', '),
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shoes');
    
    const maxWidth = headers.map((header, i) => {
      const headerLength = header.length;
      const maxDataLength = Math.max(
        ...rows.map((row) => String(row[i] || '').length)
      );
      return Math.max(headerLength, maxDataLength, 10);
    });
    
    worksheet['!cols'] = maxWidth.map((w) => ({ wch: w }));

    XLSX.writeFile(workbook, `shoes-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print PDF
  const handlePrintPDF = async () => {
    if (!filteredAndSortedShoes || filteredAndSortedShoes.length === 0) return;

    try {
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.width = '1123px';
      printContainer.style.padding = '20px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      const isRTL = document.documentElement.dir === 'rtl';
      if (isRTL) {
        printContainer.style.direction = 'rtl';
      }

      const header = document.createElement('div');
      header.style.marginBottom = '20px';
      header.style.borderBottom = '2px solid #333';
      header.style.paddingBottom = '15px';
      
      const title = document.createElement('h1');
      title.textContent = t('shoes.title');
      title.style.margin = '0 0 10px 0';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.color = '#000';
      
      const date = document.createElement('div');
      date.textContent = new Date().toLocaleDateString();
      date.style.fontSize = '12px';
      date.style.color = '#666';
      date.style.textAlign = isRTL ? 'left' : 'right';
      
      header.appendChild(title);
      header.appendChild(date);

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';
      
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#333';
      headerRow.style.color = '#fff';
      
      const headers = [
        t('shoes.name'),
        t('shoes.brand'),
        t('shoes.category'),
        t('shoes.sku'),
        t('shoes.price'),
        t('shoes.cost'),
        t('shoes.stock'),
      ];
      
      headers.forEach((headerText) => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '10px';
        th.style.textAlign = 'left';
        th.style.border = '1px solid #ddd';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      const tbody = document.createElement('tbody');
      filteredAndSortedShoes.forEach((shoe, index) => {
        const row = document.createElement('tr');
        if (index % 2 === 0) {
          row.style.backgroundColor = '#f9f9f9';
        }
        
        const totalStock = shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
        const rowData = [
          shoe.name,
          shoe.brand,
          t(categoryMap[shoe.category] || shoe.category),
          shoe.sku,
          `${shoe.price.toLocaleString()} IQD`,
          `$${shoe.costPrice.toFixed(2)}`,
          totalStock.toString(),
        ];
        
        rowData.forEach((cellText) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '8px';
          td.style.border = '1px solid #ddd';
          td.style.color = '#000';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      printContainer.appendChild(header);
      printContainer.appendChild(table);
      document.body.appendChild(printContainer);
      
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      document.body.removeChild(printContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      let heightLeft = imgHeight;
      let position = 0;
      
      while (heightLeft > 0) {
        position = heightLeft - pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`shoes-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('shoes.pdfGenerationError') || 'Failed to generate PDF');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShoe.mutateAsync(id);
      setDeleteShoeId(null);
    } catch (error) {
      console.error('Error deleting shoe:', error);
    }
  };

  const getStockStatus = (shoe: Shoe) => {
    const totalStock = shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    if (totalStock === 0) return 'out-of-stock';
    if (lowStockShoeIds.has(shoe.id)) return 'low-stock';
    return 'in-stock';
  };

  const getProfitMargin = (shoe: Shoe) => {
    if (!exchangeRate || typeof exchangeRate !== 'number') return 0;
    const costIQD = shoe.costPrice * exchangeRate;
    if (shoe.price === 0) return 0;
    return ((shoe.price - costIQD) / shoe.price) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('shoes.title')}</h1>
          <p className="text-muted-foreground">{t('shoes.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!filteredAndSortedShoes || filteredAndSortedShoes.length === 0}>
            <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('shoes.export')}
          </Button>
          <Button variant="outline" onClick={handlePrintPDF} disabled={!filteredAndSortedShoes || filteredAndSortedShoes.length === 0}>
            <FileText className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('shoes.printPDF')}
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('shoes.addShoe')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('shoes.totalShoes')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalShoes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('shoes.totalStockValue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalStockValue.toLocaleString()} IQD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('shoes.averagePrice')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averagePrice.toLocaleString()} IQD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('shoes.categories')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.entries(statistics.byCategory).map(([cat, count]) => (
                <div key={cat} className="flex justify-between">
                  <span>{t(categoryMap[cat] || cat)}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('shoes.filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="men">{t('shoes.men')}</SelectItem>
                <SelectItem value="women">{t('shoes.women')}</SelectItem>
                <SelectItem value="kids">{t('shoes.kids')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Brand Filter */}
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder={t('shoes.filterByBrand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Status Filter */}
            <Select value={filterStockStatus} onValueChange={(value) => setFilterStockStatus(value as StockStatus)}>
              <SelectTrigger>
                <SelectValue placeholder={t('shoes.filterByStock')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="in-stock">{t('shoes.inStock')}</SelectItem>
                <SelectItem value="low-stock">{t('shoes.lowStock')}</SelectItem>
                <SelectItem value="out-of-stock">{t('shoes.outOfStock')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder={t('shoes.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('common.default')}</SelectItem>
                <SelectItem value="name-asc">{t('shoes.sortByNameAsc')}</SelectItem>
                <SelectItem value="name-desc">{t('shoes.sortByNameDesc')}</SelectItem>
                <SelectItem value="brand-asc">{t('shoes.sortByBrandAsc')}</SelectItem>
                <SelectItem value="brand-desc">{t('shoes.sortByBrandDesc')}</SelectItem>
                <SelectItem value="price-asc">{t('shoes.sortByPriceAsc')}</SelectItem>
                <SelectItem value="price-desc">{t('shoes.sortByPriceDesc')}</SelectItem>
                <SelectItem value="stock-asc">{t('shoes.sortByStockAsc')}</SelectItem>
                <SelectItem value="stock-desc">{t('shoes.sortByStockDesc')}</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shoes Display */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedShoes?.map((shoe) => {
            let sizes: string[] = [];
            try {
              const sizesStr = (shoe.sizes || '').trim();
              if (sizesStr) {
                const parsed = JSON.parse(sizesStr);
                if (Array.isArray(parsed)) {
                  sizes = parsed.map((s: any) => String(s));
                }
              }
            } catch (error) {
              sizes = [];
            }
            const totalStock = shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
            const stockStatus = getStockStatus(shoe);
            const profitMargin = getProfitMargin(shoe);
            const isLowStock = lowStockShoeIds.has(shoe.id);

            return (
              <Card key={shoe.id} className={isLowStock ? 'border-destructive' : ''}>
                <CardHeader>
                  {shoe.imageUrl && (
                    <img
                      src={shoe.imageUrl}
                      alt={shoe.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{shoe.name}</CardTitle>
                      <CardDescription>
                        {shoe.brand} • {t(categoryMap[shoe.category] || shoe.category)}
                      </CardDescription>
                    </div>
                    {stockStatus === 'low-stock' && (
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    {stockStatus === 'out-of-stock' && (
                      <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('shoes.sku')}:</span>
                      <span className="font-mono">{shoe.sku}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('shoes.price')}:</span>
                      <span className="font-semibold">{shoe.price.toLocaleString()} IQD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('shoes.cost')}:</span>
                      <span className="font-semibold">${shoe.costPrice.toFixed(2)}</span>
                    </div>
                    {exchangeRate && typeof exchangeRate === 'number' && profitMargin > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('shoes.profitMargin')}:</span>
                        <span className="font-semibold text-green-600">{profitMargin.toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('shoes.sizes')}:</span>
                      <span>{sizes.join(', ') || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('shoes.stock')}:</span>
                      <span className={`font-semibold ${stockStatus === 'out-of-stock' ? 'text-destructive' : isLowStock ? 'text-orange-600' : ''}`}>
                        {totalStock}
                      </span>
                      {stockStatus === 'out-of-stock' && (
                        <span className="text-xs text-destructive">({t('shoes.outOfStock')})</span>
                      )}
                      {isLowStock && (
                        <span className="text-xs text-orange-600">({t('shoes.lowStock')})</span>
                      )}
                    </div>
                  </div>
                  {shoe.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {shoe.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/stock?shoeId=${shoe.id}`)}
                    >
                      <Package className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {t('shoes.viewStock')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditShoe(shoe)}
                    >
                      <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeleteShoeId(shoe.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">{t('shoes.name')}</th>
                    <th className="text-left p-4 font-semibold">{t('shoes.brand')}</th>
                    <th className="text-left p-4 font-semibold">{t('shoes.category')}</th>
                    <th className="text-left p-4 font-semibold">{t('shoes.sku')}</th>
                    <th className="text-left p-4 font-semibold">{t('shoes.price')}</th>
                    <th className="text-left p-4 font-semibold">{t('shoes.cost')}</th>
                    <th className="text-left p-4 font-semibold">{t('shoes.stock')}</th>
                    <th className="text-left p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedShoes?.map((shoe) => {
                    const totalStock = shoe.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
                    const stockStatus = getStockStatus(shoe);
                    const isLowStock = lowStockShoeIds.has(shoe.id);

                    return (
                      <tr key={shoe.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {shoe.imageUrl && (
                              <img
                                src={shoe.imageUrl}
                                alt={shoe.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <span className="font-medium">{shoe.name}</span>
                            {isLowStock && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">{shoe.brand}</td>
                        <td className="p-4">{t(categoryMap[shoe.category] || shoe.category)}</td>
                        <td className="p-4 font-mono text-sm">{shoe.sku}</td>
                        <td className="p-4">{shoe.price.toLocaleString()} IQD</td>
                        <td className="p-4">${shoe.costPrice.toFixed(2)}</td>
                        <td className={`p-4 font-semibold ${stockStatus === 'out-of-stock' ? 'text-destructive' : isLowStock ? 'text-orange-600' : ''}`}>
                          {totalStock}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/stock?shoeId=${shoe.id}`)}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditShoe(shoe)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteShoeId(shoe.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredAndSortedShoes?.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('shoes.noShoesFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterCategory !== 'all' || filterBrand !== 'all' || filterStockStatus !== 'all'
              ? t('shoes.noResultsFound')
              : t('shoes.getStarted')}
          </p>
          {!searchQuery && filterCategory === 'all' && filterBrand === 'all' && filterStockStatus === 'all' && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('shoes.addShoe')}
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddShoeDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {editShoe && (
        <EditShoeDialog
          shoe={editShoe}
          open={!!editShoe}
          onOpenChange={(open) => !open && setEditShoe(null)}
        />
      )}
      <AlertDialog open={deleteShoeId !== null} onOpenChange={(open) => !open && setDeleteShoeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shoes.deleteShoeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('shoes.deleteShoeConfirmDescription', {
                shoeName: shoes?.find(s => s.id === deleteShoeId)?.name || ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteShoeId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteShoeId && handleDelete(deleteShoeId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
