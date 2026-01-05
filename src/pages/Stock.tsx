import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStock, useLowStock, useDeleteStock } from '@/hooks/use-stock';
import { useShoes } from '@/hooks/use-shoes';
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
import { Plus, AlertTriangle, Edit, Trash2, Search, Grid3x3, Table2, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AddStockDialog from '@/components/AddStockDialog';
import EditStockDialog from '@/components/EditStockDialog';
import { Stock as StockType } from '@/lib/api';

type ViewMode = 'grid' | 'table';
type SortOption = 'name-asc' | 'name-desc' | 'quantity-asc' | 'quantity-desc' | 'size-asc' | 'size-desc' | 'default';

export default function Stock() {
  const { t } = useTranslation();
  const { data: stock, isLoading } = useStock();
  const { data: lowStock } = useLowStock(3);
  const { data: shoes } = useShoes();
  const deleteStock = useDeleteStock();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editStock, setEditStock] = useState<StockType | null>(null);
  const [deleteStockId, setDeleteStockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (shoeId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shoeId)) {
        newSet.delete(shoeId);
      } else {
        newSet.add(shoeId);
      }
      return newSet;
    });
  };

  // Get unique categories and brands from shoes
  const categories = useMemo(() => {
    if (!shoes) return [];
    return Array.from(new Set(shoes.map(s => s.category)));
  }, [shoes]);

  const brands = useMemo(() => {
    if (!shoes) return [];
    return Array.from(new Set(shoes.map(s => s.brand))).sort();
  }, [shoes]);

  // Filter and sort stock
  const filteredAndSortedStock = useMemo(() => {
    if (!stock) return [];

    let filtered = stock.filter((item) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.shoe?.name.toLowerCase().includes(searchLower) ||
        item.shoe?.brand.toLowerCase().includes(searchLower) ||
        item.shoe?.category.toLowerCase().includes(searchLower) ||
        item.size.toLowerCase().includes(searchLower) ||
        item.shoe?.sku?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = filterCategory === 'all' || item.shoe?.category === filterCategory;

      // Brand filter
      const matchesBrand = filterBrand === 'all' || item.shoe?.brand === filterBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Sort
    if (sortOption !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return (a.shoe?.name || '').localeCompare(b.shoe?.name || '');
          case 'name-desc':
            return (b.shoe?.name || '').localeCompare(a.shoe?.name || '');
          case 'quantity-asc':
            return a.quantity - b.quantity;
          case 'quantity-desc':
            return b.quantity - a.quantity;
          case 'size-asc':
            return parseFloat(a.size) - parseFloat(b.size);
          case 'size-desc':
            return parseFloat(b.size) - parseFloat(a.size);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [stock, searchQuery, filterCategory, filterBrand, sortOption]);

  // Get low stock shoe IDs
  const lowStockShoeIds = new Set(lowStock?.map((s) => s.shoeId) || []);

  // Group stock by shoe for grid view
  const groupedStock = useMemo(() => {
    if (!filteredAndSortedStock || filteredAndSortedStock.length === 0) return [];

    // Group by shoeId
    const groupedMap = new Map<string, {
      shoeId: string;
      shoe: typeof filteredAndSortedStock[0]['shoe'];
      stockEntries: typeof filteredAndSortedStock;
      totalQuantity: number;
      isLowStock: boolean;
    }>();

    filteredAndSortedStock.forEach((item) => {
      const shoeId = item.shoeId;
      if (!groupedMap.has(shoeId)) {
        groupedMap.set(shoeId, {
          shoeId,
          shoe: item.shoe,
          stockEntries: [],
          totalQuantity: 0,
          isLowStock: lowStockShoeIds.has(shoeId),
        });
      }
      const group = groupedMap.get(shoeId)!;
      group.stockEntries.push(item);
      group.totalQuantity += item.quantity;
    });

    // Convert to array and sort
    let groupedArray = Array.from(groupedMap.values());

    // Sort groups based on sortOption
    if (sortOption !== 'default') {
      groupedArray = [...groupedArray].sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return (a.shoe?.name || '').localeCompare(b.shoe?.name || '');
          case 'name-desc':
            return (b.shoe?.name || '').localeCompare(a.shoe?.name || '');
          case 'quantity-asc':
            return a.totalQuantity - b.totalQuantity;
          case 'quantity-desc':
            return b.totalQuantity - a.totalQuantity;
          case 'size-asc':
            // Sort by smallest size in the group
            const minSizeA = Math.min(...a.stockEntries.map(e => parseFloat(e.size) || 0));
            const minSizeB = Math.min(...b.stockEntries.map(e => parseFloat(e.size) || 0));
            return minSizeA - minSizeB;
          case 'size-desc':
            // Sort by largest size in the group
            const maxSizeA = Math.max(...a.stockEntries.map(e => parseFloat(e.size) || 0));
            const maxSizeB = Math.max(...b.stockEntries.map(e => parseFloat(e.size) || 0));
            return maxSizeB - maxSizeA;
          default:
            return 0;
        }
      });
    }

    // Sort sizes within each group
    groupedArray.forEach((group) => {
      group.stockEntries.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    });

    return groupedArray;
  }, [filteredAndSortedStock, sortOption, lowStockShoeIds]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!stock) return { totalItems: 0, totalQuantity: 0, lowStockCount: 0 };
    // Count unique shoes instead of stock entries
    const uniqueShoes = new Set(stock.map(item => item.shoeId));
    return {
      totalItems: uniqueShoes.size,
      totalQuantity: stock.reduce((sum, item) => sum + item.quantity, 0),
      lowStockCount: lowStock?.length || 0,
    };
  }, [stock, lowStock]);

  // Export to Excel
  const handleExport = () => {
    if (!filteredAndSortedStock || filteredAndSortedStock.length === 0) return;

    const headers = [t('stock.shoeName'), t('stock.brand'), t('stock.category'), t('stock.size'), t('stock.quantity'), 'SKU'];
    const rows = filteredAndSortedStock.map((item) => [
      item.shoe?.name || '',
      item.shoe?.brand || '',
      item.shoe?.category || '',
      item.size,
      item.quantity,
      item.shoe?.sku || '',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
    
    // Auto-size columns
    const maxWidth = headers.map((header, i) => {
      const headerLength = header.length;
      const maxDataLength = Math.max(
        ...rows.map((row) => String(row[i] || '').length)
      );
      return Math.max(headerLength, maxDataLength, 10);
    });
    
    worksheet['!cols'] = maxWidth.map((w) => ({ wch: w }));

    XLSX.writeFile(workbook, `stock-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print PDF using html2canvas for proper Unicode support
  const handlePrintPDF = async () => {
    if (!filteredAndSortedStock || filteredAndSortedStock.length === 0) return;

    try {
      // Create a temporary container for the PDF content
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.width = '1123px'; // A4 landscape width in pixels at 96 DPI
      printContainer.style.padding = '20px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      // Get current language direction
      const isRTL = document.documentElement.dir === 'rtl';
      if (isRTL) {
        printContainer.style.direction = 'rtl';
      }

      // Create header
      const header = document.createElement('div');
      header.style.marginBottom = '20px';
      header.style.borderBottom = '2px solid #333';
      header.style.paddingBottom = '15px';
      
      const title = document.createElement('h1');
      title.textContent = t('stock.title');
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

      // Create statistics section
      const statsSection = document.createElement('div');
      statsSection.style.display = 'flex';
      statsSection.style.gap = '15px';
      statsSection.style.marginBottom = '20px';
      statsSection.style.flexDirection = isRTL ? 'row-reverse' : 'row';
      
      const stats = [
        { label: t('stock.totalItems'), value: statistics.totalItems },
        { label: t('stock.totalQuantity'), value: statistics.totalQuantity },
        { label: t('stock.lowStockCount'), value: statistics.lowStockCount },
      ];
      
      stats.forEach((stat) => {
        const statBox = document.createElement('div');
        statBox.style.flex = '1';
        statBox.style.padding = '10px';
        statBox.style.backgroundColor = '#f5f5f5';
        statBox.style.borderRadius = '4px';
        statBox.style.textAlign = 'center';
        
        const label = document.createElement('div');
        label.textContent = stat.label;
        label.style.fontSize = '12px';
        label.style.color = '#666';
        label.style.marginBottom = '5px';
        
        const value = document.createElement('div');
        value.textContent = stat.value.toString();
        value.style.fontSize = '18px';
        value.style.fontWeight = 'bold';
        value.style.color = '#000';
        
        statBox.appendChild(label);
        statBox.appendChild(value);
        statsSection.appendChild(statBox);
      });

      // Create table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';
      table.style.marginTop = '20px';
      
      // Table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#333';
      headerRow.style.color = '#fff';
      
      const headers = [t('stock.shoeName'), t('stock.brand'), t('stock.category'), t('stock.size'), t('stock.quantity'), 'SKU'];
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
      
      // Table body
      const tbody = document.createElement('tbody');
      filteredAndSortedStock.forEach((item, index) => {
        const row = document.createElement('tr');
        if (index % 2 === 0) {
          row.style.backgroundColor = '#f9f9f9';
        }
        
        const isLowStock = lowStockShoeIds.has(item.shoeId);
        const rowData = [
          item.shoe?.name || '',
          item.shoe?.brand || '',
          item.shoe?.category || '',
          item.size,
          item.quantity.toString(),
          item.shoe?.sku || '',
        ];
        
        rowData.forEach((cellText, cellIndex) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '8px';
          td.style.border = '1px solid #ddd';
          td.style.color = isLowStock && cellIndex === 4 ? '#d32f2f' : '#000';
          if (isLowStock && cellIndex === 4) {
            td.style.fontWeight = 'bold';
          }
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      
      // Assemble container
      printContainer.appendChild(header);
      printContainer.appendChild(statsSection);
      printContainer.appendChild(table);
      document.body.appendChild(printContainer);
      
      // Capture as image
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      // Remove temporary container
      document.body.removeChild(printContainer);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // If content is taller than one page, add additional pages
      let heightLeft = imgHeight;
      let position = 0;
      
      while (heightLeft > 0) {
        position = heightLeft - pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      // Save PDF
      pdf.save(`stock-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('stock.pdfGenerationError') || 'Failed to generate PDF');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStock.mutateAsync(id);
      setDeleteStockId(null);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Error deleting stock:', error);
    }
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
          <h1 className="text-3xl font-bold">{t('stock.title')}</h1>
          <p className="text-muted-foreground">{t('stock.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!filteredAndSortedStock || filteredAndSortedStock.length === 0}>
            <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('stock.export')}
          </Button>
          <Button variant="outline" onClick={handlePrintPDF} disabled={!filteredAndSortedStock || filteredAndSortedStock.length === 0}>
            <FileText className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('stock.printPDF')}
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('stock.addStock')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('stock.totalItems')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('stock.totalQuantity')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalQuantity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('stock.lowStockCount')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statistics.lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('stock.lowStockAlert')}
            </CardTitle>
            <CardDescription>
              {t('stock.lowStockDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.map((item) => (
                <div
                  key={item.shoeId}
                  className="flex items-center justify-between p-2 bg-destructive/10 rounded"
                >
                  <div>
                    <span className="font-semibold">{item.shoe?.name}</span>
                  </div>
                  <span className="font-bold text-destructive">{item.quantity} {t('stock.units')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <SelectValue placeholder={t('stock.filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`shoes.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Brand Filter */}
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder={t('stock.filterByBrand')} />
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

            {/* Sort */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder={t('stock.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('common.default')}</SelectItem>
                <SelectItem value="name-asc">{t('stock.sortByNameAsc')}</SelectItem>
                <SelectItem value="name-desc">{t('stock.sortByNameDesc')}</SelectItem>
                <SelectItem value="quantity-asc">{t('stock.sortByQuantityAsc')}</SelectItem>
                <SelectItem value="quantity-desc">{t('stock.sortByQuantityDesc')}</SelectItem>
                <SelectItem value="size-asc">{t('stock.sortBySizeAsc')}</SelectItem>
                <SelectItem value="size-desc">{t('stock.sortBySizeDesc')}</SelectItem>
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

      {/* Stock Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groupedStock?.map((group) => {
            const isExpanded = expandedCards.has(group.shoeId);
            return (
              <Card 
                key={group.shoeId} 
                className={`${group.isLowStock ? 'border-destructive' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => toggleCardExpansion(group.shoeId)}
              >
                <CardHeader className="cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.shoe?.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {group.shoe?.brand} • {group.shoe?.category}
                      </CardDescription>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2 rtl:mr-2 rtl:ml-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2 rtl:mr-2 rtl:ml-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.shoe?.sku && (
                      <div className="pb-2 border-b">
                        <div className="text-xs text-muted-foreground">SKU</div>
                        <div className="text-sm font-mono">{group.shoe.sku}</div>
                      </div>
                    )}
                    {isExpanded ? (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">{t('shoes.sizes')}</div>
                        <div className="space-y-2">
                          {group.stockEntries.map((stockEntry) => {
                            const isSizeLowStock = lowStockShoeIds.has(stockEntry.shoeId);
                            return (
                              <div
                                key={stockEntry.id}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">
                                    {t('stock.size')} {stockEntry.size}
                                  </div>
                                  <div
                                    className={`text-lg font-bold ${
                                      isSizeLowStock ? 'text-destructive' : ''
                                    }`}
                                  >
                                    {stockEntry.quantity}
                                    {isSizeLowStock && (
                                      <AlertTriangle className="inline-block ml-1 h-4 w-4 rtl:mr-1 rtl:ml-0" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditStock(stockEntry);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteStockId(stockEntry.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {group.stockEntries.length} {group.stockEntries.length === 1 ? t('stock.size') : t('shoes.sizes')}, {group.totalQuantity} {t('stock.units')}
                      </div>
                    )}
                    {group.isLowStock && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{t('shoes.lowStock')}</span>
                        </div>
                      </div>
                    )}
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
                    <th className="text-left p-4 font-semibold">{t('stock.shoeName')}</th>
                    <th className="text-left p-4 font-semibold">{t('stock.brand')}</th>
                    <th className="text-left p-4 font-semibold">{t('stock.category')}</th>
                    <th className="text-left p-4 font-semibold">{t('stock.size')}</th>
                    <th className="text-left p-4 font-semibold">{t('stock.quantity')}</th>
                    <th className="text-left p-4 font-semibold">SKU</th>
                    <th className="text-left p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStock?.map((item) => {
                    const isLowStock = lowStockShoeIds.has(item.shoeId);
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{item.shoe?.name}</td>
                        <td className="p-4">{item.shoe?.brand}</td>
                        <td className="p-4">{item.shoe?.category}</td>
                        <td className="p-4">{item.size}</td>
                        <td className={`p-4 font-semibold ${isLowStock ? 'text-destructive' : ''}`}>
                          {item.quantity}
                          {isLowStock && (
                            <AlertTriangle className="inline-block ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm">{item.shoe?.sku || '-'}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditStock(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteStockId(item.id)}
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

      {filteredAndSortedStock?.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('stock.noStockFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterCategory !== 'all' || filterBrand !== 'all'
              ? t('stock.noResultsFound')
              : t('stock.addStockMessage')}
          </p>
          {!searchQuery && filterCategory === 'all' && filterBrand === 'all' && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('stock.addStock')}
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddStockDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} shoes={shoes || []} />
      {editStock && (
        <EditStockDialog
          stock={editStock}
          open={!!editStock}
          onOpenChange={(open) => !open && setEditStock(null)}
        />
      )}
      <AlertDialog open={deleteStockId !== null} onOpenChange={(open) => !open && setDeleteStockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('stock.deleteStockConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('stock.deleteStockConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStockId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStockId && handleDelete(deleteStockId)}
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
