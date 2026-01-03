export type DiseaseDropdownOption = {
  value: string;
  label: string;
  subLabel?: string;
  disabled?: boolean;
};

export type Props = {
  value: string;
  options: DiseaseDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;

  className?: string;
  menuMaxHeight?: number; 
};

export type MenuPos = {
  top: number;
  left: number;
  width: number;
};