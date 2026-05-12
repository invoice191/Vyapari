import html2canvas from 'html2canvas';

export async function captureChartAsImage(el: HTMLElement): Promise<string> {
  const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
  return canvas.toDataURL('image/png');
}
