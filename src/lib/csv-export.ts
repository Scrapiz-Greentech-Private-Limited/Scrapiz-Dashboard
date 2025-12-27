/**
 * CSV Export Utility Functions
 * Provides functionality to export data to CSV format
 */

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => escapeCSVValue(col.label));
  const headerRow = headers.join(',');

  // Create data rows
  const dataRows = data.map(item => {
    const values = columns.map(col => {
      const value = item[col.key];
      return escapeCSVValue(formatValue(value));
    });
    return values.join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Format value for CSV export
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.join('; ');
    }
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create a link to the file
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  const csvContent = convertToCSV(data, columns);
  downloadCSV(csvContent, filename);
}
