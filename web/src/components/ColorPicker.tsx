import { DEFAULT_PALETTE } from '../utils';

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="color-picker">
      {DEFAULT_PALETTE.map((color) => (
        <div
          key={color}
          className={`color-swatch ${value === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          title={color}
        />
      ))}
    </div>
  );
}
