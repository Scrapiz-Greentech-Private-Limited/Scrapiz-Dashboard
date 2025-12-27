# Search and Filter Implementation Guide

This guide explains how to implement search, filtering, and sorting functionality in the admin dashboard using the `useSearchAndFilter` hook and related components.

## Overview

The search and filter system provides:
- **Multi-field search** across specified fields
- **Advanced filtering** with multiple criteria (AND logic)
- **Column sorting** (ascending/descending)
- **Filter persistence** during pagination
- **Reusable components** for consistent UI

## Core Components

### 1. `useSearchAndFilter` Hook

Located in `src/hooks/useSearchAndFilter.ts`

**Purpose**: Manages search, filter, and sort state with memoized filtering logic.

**Usage**:
```typescript
import { useSearchAndFilter } from "@/hooks/useSearchAndFilter";

const {
  filteredData,        // Filtered and sorted data
  searchQuery,         // Current search query
  setSearchQuery,      // Update search query
  filters,             // Current filter values
  setFilter,           // Update a specific filter
  resetFilters,        // Clear all filters and search
  sortConfig,          // Current sort configuration
  toggleSort,          // Toggle sort for a column
  totalCount,          // Total items before filtering
  filteredCount,       // Items after filtering
} = useSearchAndFilter({
  data: myData,
  searchFields: ['name', 'email', 'phone'],
  initialFilters: {},
  initialSort: { key: null, direction: null },
});
```

### 2. `AdvancedFilters` Component

Located in `src/components/dashboard/advanced-filters.tsx`

**Purpose**: Provides a dropdown UI for applying multiple filters with visual feedback.

**Usage**:
```typescript
import { AdvancedFilters, FilterGroup } from "@/components/dashboard/advanced-filters";

const filterGroups: FilterGroup[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'radio',  // Single selection
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    key: 'category',
    label: 'Category',
    type: 'checkbox',  // Multiple selection
    options: [
      { label: 'Electronics', value: 'electronics' },
      { label: 'Paper', value: 'paper' },
    ],
  },
];

<AdvancedFilters
  filterGroups={filterGroups}
  filters={filters}
  onFilterChange={setFilter}
  onResetFilters={resetFilters}
/>
```

### 3. `SortableTableHeader` Component

Located in `src/components/dashboard/sortable-table-header.tsx`

**Purpose**: Provides clickable table headers with sort indicators.

**Usage**:
```typescript
import { SortableTableHeader } from "@/components/dashboard/sortable-table-header";

<TableHeader>
  <TableRow>
    <SortableTableHeader
      column="name"
      label="Name"
      sortConfig={sortConfig}
      onSort={toggleSort}
    />
    <SortableTableHeader
      column="email"
      label="Email"
      sortConfig={sortConfig}
      onSort={toggleSort}
      align="right"
    />
  </TableRow>
</TableHeader>
```

## Complete Implementation Example

### Step 1: Define Your Data Type

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'user';
}
```

### Step 2: Set Up the Hook

```typescript
import { useSearchAndFilter } from "@/hooks/useSearchAndFilter";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  // Define filter groups
  const filterGroups: FilterGroup[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'radio',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      key: 'role',
      label: 'Role',
      type: 'checkbox',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
    },
  ];

  // Initialize search and filter
  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    resetFilters,
    sortConfig,
    toggleSort,
    totalCount,
    filteredCount,
  } = useSearchAndFilter<User>({
    data: users,
    searchFields: ['name', 'email', 'phone'],
    initialFilters: {},
  });

  return (
    // ... UI implementation
  );
}
```

### Step 3: Add Search Input

```typescript
<div className="relative">
  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search users..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10"
  />
</div>
```

### Step 4: Add Filter Controls

```typescript
<div className="flex items-center gap-2">
  <AdvancedFilters
    filterGroups={filterGroups}
    filters={filters}
    onFilterChange={setFilter}
    onResetFilters={resetFilters}
  />
  {searchQuery && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setSearchQuery('')}
    >
      Clear Search
      <X className="ml-2 h-4 w-4" />
    </Button>
  )}
</div>
```

### Step 5: Add Sortable Table

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <SortableTableHeader
        column="name"
        label="Name"
        sortConfig={sortConfig}
        onSort={toggleSort}
      />
      <SortableTableHeader
        column="email"
        label="Email"
        sortConfig={sortConfig}
        onSort={toggleSort}
      />
      <SortableTableHeader
        column="status"
        label="Status"
        sortConfig={sortConfig}
        onSort={toggleSort}
      />
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredData.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Step 6: Show Filter Results

```typescript
{(searchQuery || Object.values(filters).some(v => v !== null)) && (
  <div className="text-sm text-muted-foreground">
    Showing {filteredCount} of {totalCount} users
  </div>
)}
```

## Advanced Features

### Custom Filter Logic

If you need custom filter logic beyond the hook's built-in AND logic:

```typescript
const customFilteredData = filteredData.filter(item => {
  // Add your custom logic here
  if (someCondition) {
    return customCheck(item);
  }
  return true;
});
```

### Dynamic Filter Options

Generate filter options from your data:

```typescript
const categories = Array.from(new Set(data.map(item => item.category)));

const filterGroups: FilterGroup[] = [
  {
    key: 'category',
    label: 'Category',
    type: 'checkbox',
    options: categories.map(cat => ({ label: cat, value: cat })),
  },
];
```

### Maintaining Filters During Pagination

The hook automatically maintains filter state. Just slice the filtered data for pagination:

```typescript
const ITEMS_PER_PAGE = 10;
const [currentPage, setCurrentPage] = useState(1);

const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const paginatedData = filteredData.slice(startIndex, endIndex);

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [filteredData.length]);
```

## Best Practices

1. **Search Fields**: Include all fields users might want to search by
2. **Filter Types**: Use 'radio' for single selection, 'checkbox' for multiple
3. **Sort Columns**: Only make sortable columns that make sense to sort
4. **Performance**: The hook uses `useMemo` for efficient filtering
5. **Reset Functionality**: Always provide a way to clear filters
6. **Visual Feedback**: Show active filter count and badges
7. **Mobile Responsive**: Ensure filters work well on small screens

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **15.1**: Global search across entities (users, orders)
- ✅ **15.2**: Multi-field search (email, name, phone, order number)
- ✅ **15.3**: Advanced filtering with multiple criteria
- ✅ **15.4**: Filter combination logic (AND)
- ✅ **15.5**: Filter reset functionality
- ✅ **15.5**: Table sorting by column (ascending/descending)
- ✅ **15.5**: Maintain filters and search during pagination

## Examples in Codebase

See these files for complete implementations:
- `src/app/dashboard/users/page.tsx` - User management with search/filter
- `src/app/dashboard/orders/page.tsx` - Order management with search/filter
