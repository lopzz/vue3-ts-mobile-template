interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface Props {
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export { Option, Props };
