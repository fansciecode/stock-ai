import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../config';

const useTable = (options = {}) => {
    const {
        data = [],
        defaultSort = { field: '', direction: 'asc' },
        defaultPage = 0,
        defaultPageSize = DEFAULT_PAGE_SIZE,
        defaultSelected = [],
        onSelectionChange,
        onSortChange,
        onPageChange,
        onPageSizeChange,
        serverSide = false
    } = options;

    // State
    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [sort, setSort] = useState(defaultSort);
    const [selected, setSelected] = useState(defaultSelected);
    const [filters, setFilters] = useState({});

    // Calculate total pages
    const totalPages = useMemo(() => {
        if (serverSide) return null;
        return Math.ceil(data.length / pageSize);
    }, [data.length, pageSize, serverSide]);

    // Handle page change
    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
        if (onPageChange) {
            onPageChange(newPage);
        }
    }, [onPageChange]);

    // Handle page size change
    const handlePageSizeChange = useCallback((newPageSize) => {
        setPageSize(newPageSize);
        setPage(0); // Reset to first page
        if (onPageSizeChange) {
            onPageSizeChange(newPageSize);
        }
    }, [onPageSizeChange]);

    // Handle sort change
    const handleSortChange = useCallback((field) => {
        setSort(prev => {
            const newSort = {
                field,
                direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
            };
            if (onSortChange) {
                onSortChange(newSort);
            }
            return newSort;
        });
    }, [onSortChange]);

    // Handle selection change
    const handleSelectionChange = useCallback((selectedIds) => {
        setSelected(selectedIds);
        if (onSelectionChange) {
            onSelectionChange(selectedIds);
        }
    }, [onSelectionChange]);

    // Handle single row selection
    const handleSelectOne = useCallback((id) => {
        setSelected(prev => {
            const newSelected = prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id];

            if (onSelectionChange) {
                onSelectionChange(newSelected);
            }

            return newSelected;
        });
    }, [onSelectionChange]);

    // Handle all rows selection
    const handleSelectAll = useCallback((checked) => {
        const newSelected = checked
            ? data.map(item => item.id)
            : [];

        setSelected(newSelected);
        if (onSelectionChange) {
            onSelectionChange(newSelected);
        }
    }, [data, onSelectionChange]);

    // Handle filter change
    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(0); // Reset to first page when filter changes
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({});
        setPage(0);
    }, []);

    // Process data (for client-side operations)
    const processedData = useMemo(() => {
        if (serverSide) return data;

        let result = [...data];

        // Apply filters
        Object.entries(filters).forEach(([field, value]) => {
            if (value !== undefined && value !== '') {
                result = result.filter(item => {
                    const fieldValue = item[field];
                    if (typeof value === 'string') {
                        return String(fieldValue)
                            .toLowerCase()
                            .includes(value.toLowerCase());
                    }
                    return fieldValue === value;
                });
            }
        });

        // Apply sorting
        if (sort.field) {
            result.sort((a, b) => {
                const aValue = a[sort.field];
                const bValue = b[sort.field];

                if (aValue === bValue) return 0;
                
                const comparison = aValue < bValue ? -1 : 1;
                return sort.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, filters, sort, serverSide]);

    // Get paginated data
    const paginatedData = useMemo(() => {
        if (serverSide) return processedData;

        const start = page * pageSize;
        const end = start + pageSize;
        return processedData.slice(start, end);
    }, [processedData, page, pageSize, serverSide]);

    // Get table props
    const getTableProps = useCallback(() => ({
        page,
        pageSize,
        sort,
        selected,
        filters,
        onPageChange: handlePageChange,
        onPageSizeChange: handlePageSizeChange,
        onSortChange: handleSortChange,
        onSelectionChange: handleSelectionChange,
        onSelectOne: handleSelectOne,
        onSelectAll: handleSelectAll,
        onFilterChange: handleFilterChange
    }), [
        page,
        pageSize,
        sort,
        selected,
        filters,
        handlePageChange,
        handlePageSizeChange,
        handleSortChange,
        handleSelectionChange,
        handleSelectOne,
        handleSelectAll,
        handleFilterChange
    ]);

    return {
        // State
        page,
        pageSize,
        sort,
        selected,
        filters,
        totalPages,

        // Data
        data: paginatedData,
        totalItems: processedData.length,

        // Actions
        setPage,
        setPageSize,
        setSort,
        setSelected,
        setFilters,
        clearFilters,

        // Handlers
        handlePageChange,
        handlePageSizeChange,
        handleSortChange,
        handleSelectionChange,
        handleSelectOne,
        handleSelectAll,
        handleFilterChange,

        // Props getter
        getTableProps
    };
};

export default useTable; 