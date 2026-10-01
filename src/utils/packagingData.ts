import { PackagingType, PackagingSizeOption } from '../types';

export const STANDARD_BOX_SIZES: PackagingSizeOption[] = [
  { id: 'box-00', type: 'box', name: 'เบอร์ 00', dimensions: '9.5 x 14 x 6 cm', description: 'เครื่องสำอาง, ลิปสติก, ของชิ้นเล็ก', popular: true },
  { id: 'box-0', type: 'box', name: 'เบอร์ 0', dimensions: '11 x 17 x 6 cm', description: 'เคสมือถือ, แว่นตา, นาฬิกา', popular: true },
  { id: 'box-04', type: 'box', name: 'เบอร์ 0+4', dimensions: '11 x 17 x 10 cm', description: 'ขวดเซรั่ม, กระปุกครีมทรงสูง' },
  { id: 'box-A', type: 'box', name: 'เบอร์ A', dimensions: '14 x 20 x 6 cm', description: 'เสื้อผ้า 1 ตัว, กระเป๋าสตางค์', popular: true },
  { id: 'box-2A', type: 'box', name: 'เบอร์ 2A', dimensions: '14 x 20 x 12 cm', description: 'กล่องทรงสูงกว่า A เท่าตัว' },
  { id: 'box-B', type: 'box', name: 'เบอร์ B', dimensions: '17 x 25 x 9 cm', description: 'เสื้อ 1-2 ตัว, หนังสือ, ยาสามัญ', popular: true },
  { id: 'box-2B', type: 'box', name: 'เบอร์ 2B', dimensions: '17 x 25 x 18 cm', description: 'รองเท้าแตะ, หมวกแก๊ป' },
  { id: 'box-C', type: 'box', name: 'เบอร์ C', dimensions: '20 x 30 x 11 cm', description: 'เสื้อผ้า 2-3 ตัว, ของใช้ทั่วไป', popular: true },
  { id: 'box-C8', type: 'box', name: 'เบอร์ C+8', dimensions: '20 x 30 x 19 cm', description: 'ของใช้ชิ้นหนา, เครื่องครัวเล็ก' },
  { id: 'box-CD', type: 'box', name: 'เบอร์ CD', dimensions: '15 x 15 x 15 cm', description: 'กล่องจัตุรัส, แก้วน้ำ, ของขวัญ' },
  { id: 'box-D', type: 'box', name: 'เบอร์ D', dimensions: '22 x 35 x 14 cm', description: 'กล่องรองเท้าผ้าใบ, อุปกรณ์กีฬา', popular: true },
  { id: 'box-2D', type: 'box', name: 'เบอร์ 2D', dimensions: '22 x 35 x 28 cm', description: 'รองเท้าบูท, กระเป๋าสะพาย' },
  { id: 'box-E', type: 'box', name: 'เบอร์ E', dimensions: '24 x 40 x 17 cm', description: 'เสื้อกันหนาว, กางเกงยีนส์หลายตัว' },
  { id: 'box-F', type: 'box', name: 'เบอร์ F', dimensions: '30 x 45 x 20 cm', description: 'กล่องใหญ่, เครื่องใช้ไฟฟ้า, หม้อหุงข้าว' },
  { id: 'box-G', type: 'box', name: 'เบอร์ G', dimensions: '31 x 36 x 26 cm', description: 'กล่องทรงลูกเต๋า 30 ซม.' },
  { id: 'box-H', type: 'box', name: 'เบอร์ H', dimensions: '40 x 45 x 35 cm', description: 'กล่องจุพิเศษ, เครื่องนอน, หมอน' },
  { id: 'box-I', type: 'box', name: 'เบอร์ I', dimensions: '45 x 55 x 40 cm', description: 'กล่องขนาดใหญ่สุดมาตรฐานไปรษณีย์' },
  { id: 'box-S-plus', type: 'box', name: 'เบอร์ S+', dimensions: '24 x 37 x 14 cm', description: 'กล่องมาตรฐาน Shopee / Lazada S+' },
  { id: 'box-M', type: 'box', name: 'เบอร์ M', dimensions: '27 x 43 x 20 cm', description: 'Kerry / Flash มาตรฐาน M' },
  { id: 'box-L', type: 'box', name: 'เบอร์ L', dimensions: '40 x 50 x 30 cm', description: 'Kerry / Flash มาตรฐาน L' }
];

export const STANDARD_BAG_SIZES: PackagingSizeOption[] = [
  { id: 'bag-17-30', type: 'bag', name: 'ถุง 17 x 30 cm', dimensions: '17 x 30 cm', description: 'เคสมือถือ, เครื่องประดับ, ถุงเท้า' },
  { id: 'bag-20-30', type: 'bag', name: 'ถุง 20 x 30 cm', dimensions: '20 x 30 cm', description: 'เสื้อยืด 1 ตัว, ผ้าเช็ดหน้า' },
  { id: 'bag-25-35', type: 'bag', name: 'ถุง 25 x 35 cm', dimensions: '25 x 35 cm', description: 'เสื้อผ้า 1-2 ตัว, ไซส์ยอดนิยมอันดับ 1', popular: true },
  { id: 'bag-28-42', type: 'bag', name: 'ถุง 28 x 42 cm', dimensions: '28 x 42 cm', description: 'เสื้อผ้า 2-3 ตัว, กางเกงยีนส์', popular: true },
  { id: 'bag-32-45', type: 'bag', name: 'ถุง 32 x 45 cm', dimensions: '32 x 45 cm', description: 'เสื้อกันหนาว, เสื้อฮู้ด, ผ้าปูที่นอน', popular: true },
  { id: 'bag-38-52', type: 'bag', name: 'ถุง 38 x 52 cm', dimensions: '38 x 52 cm', description: 'เสื้อผ้า 4-6 ชิ้น, ผ้านวมบาง' },
  { id: 'bag-45-60', type: 'bag', name: 'ถุง 45 x 60 cm', dimensions: '45 x 60 cm', description: 'ผ้านวมหนา, กระเป๋าเป้, เสื้อผ้าเซ็ตใหญ่' },
  { id: 'bag-50-70', type: 'bag', name: 'ถุง 50 x 70 cm', dimensions: '50 x 70 cm', description: 'ขนาดใหญ่พิเศษ จุสินค้าปริมาณมาก' }
];

export const STANDARD_ENVELOPE_SIZES: PackagingSizeOption[] = [
  { id: 'env-c6', type: 'envelope', name: 'ซอง C6', dimensions: '11.4 x 16.2 cm', description: 'บัตร, การ์ด, จดหมาย, พวงกุญแจ' },
  { id: 'env-c5', type: 'envelope', name: 'ซอง C5', dimensions: '16.2 x 22.9 cm', description: 'เอกสารพับครึ่ง A5, หนังสือเล่มเล็ก' },
  { id: 'env-c4', type: 'envelope', name: 'ซอง C4', dimensions: '22.9 x 32.4 cm', description: 'เอกสาร A4 เต็มแผ่น ไม่ต้องพับ' },
  { id: 'env-ka-9-12', type: 'envelope', name: 'ซองน้ำตาล KA 9x12 นิ้ว', dimensions: '22.9 x 30.5 cm', description: 'ซองเอกสาร A4 มีกาว/เชือกผูก', popular: true },
  { id: 'env-ka-10-14', type: 'envelope', name: 'ซองน้ำตาล KA 10x14 นิ้ว', dimensions: '25.4 x 35.6 cm', description: 'ซองเอกสาร A4+ มีขยายข้าง' },
  { id: 'env-bubble-11-15', type: 'envelope', name: 'บับเบิ้ล 11 x 15 cm', dimensions: '11 x 15 cm', description: 'ซองกันกระแทกชิ้นเล็ก, USB, ต่างหู' },
  { id: 'env-bubble-15-20', type: 'envelope', name: 'บับเบิ้ล 15 x 20 cm', dimensions: '15 x 20 cm', description: 'ซองกันกระแทก A5, สมาร์ตโฟน, เครื่องสำอาง', popular: true },
  { id: 'env-bubble-18-25', type: 'envelope', name: 'บับเบิ้ล 18 x 25 cm', dimensions: '18 x 25 cm', description: 'ซองกันกระแทก B5, พาวเวอร์แบงค์' },
  { id: 'env-bubble-22-30', type: 'envelope', name: 'บับเบิ้ล 22 x 30 cm', dimensions: '22 x 30 cm', description: 'ซองกันกระแทก A4, แท็บเล็ต, เอกสารสำคัญ', popular: true },
  { id: 'env-bubble-25-35', type: 'envelope', name: 'บับเบิ้ล 25 x 35 cm', dimensions: '25 x 35 cm', description: 'ซองกันกระแทก A4+ ขยายใหญ่' },
  { id: 'env-expand-a4', type: 'envelope', name: 'ซองขยายข้าง A4', dimensions: '25 x 35 x 5 cm', description: 'เอกสารหนา, แคตตาล็อก, แฟ้ม' }
];

export const PACKAGING_TYPE_LABELS: Record<PackagingType, { label: string; icon: string; short: string }> = {
  box: { label: 'กล่องพัสดุ', icon: '📦', short: 'กล่อง' },
  bag: { label: 'ถุงไปรษณีย์', icon: '🛍️', short: 'ถุง' },
  envelope: { label: 'ซองพัสดุ / กันกระแทก', icon: '✉️', short: 'ซอง' },
};

export function getSizesByType(type: PackagingType): PackagingSizeOption[] {
  switch (type) {
    case 'box':
      return STANDARD_BOX_SIZES;
    case 'bag':
      return STANDARD_BAG_SIZES;
    case 'envelope':
      return STANDARD_ENVELOPE_SIZES;
    default:
      return STANDARD_BOX_SIZES;
  }
}
