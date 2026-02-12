import type { ColumnDef } from '../typings';
import { isNumber } from './utils';

const getWidth = (column: ColumnDef) => ({
  width: column.width
    ? isNumber(column.width)
      ? `${column.width}px`
      : `${column.width}`
    : 'auto',
  minWidth: column.minWidth
    ? isNumber(column.minWidth)
      ? `${column.minWidth}px`
      : `${column.minWidth}`
    : 'auto',
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
