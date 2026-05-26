export default function WineColorDot({ color }) {
  const colors = {
    Red: '#8B1A2F',
    White: '#D4B483',
    Rosé: '#E8A0A0',
    Orange: '#C97D3A',
    Sparkling: '#C8D8A0',
  };
  return (
    <span
      className="wine-dot"
      style={{ background: colors[color] || '#999' }}
      title={color}
    />
  );
}
