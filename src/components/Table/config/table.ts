import type { ColumnDef } from './types';

const getWidth = (column: ColumnDef) => ({
  width: column.width ? `${column.width}` : 'auto',
  minWidth: column.minWidth ? `${column.minWidth}` : 'auto',
  flex: column.width ? '0 0 auto' : undefined,
});

const getCommonClass = ({
  column,
  isHeader,
}: {
  column: ColumnDef;
  isHeader: boolean;
}) => ({
  [`align-${column.align}-${isHeader ? 'header' : 'cell'}`]: !!column.align,
  'text-ellipsis': column?.ellipsis !== false,
});

export { getWidth, getCommonClass };
