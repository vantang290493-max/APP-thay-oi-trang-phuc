
export enum PoseStyle {
  NGHIENG_BUOC_DI = 'Nghiêng bước đi',
  NGOI_TUA = 'Ngồi / Tựa nhẹ',
  DUOI_LEN = 'Dưới lên nhẹ',
  SAU_LUNG = 'Sau lưng / Quay đầu',
  DUNG_THANG = 'Đứng thẳng',
  CHONG_NANH = 'Chống nạnh',
  DANG_DI = 'Đang đi',
  DANG_NGOI = 'Đang ngồi',
  NANG_DONG = 'Năng động',
  TOAN_THAN = 'Toàn thân',
  QUYEN_RU = 'Quyến rũ'
}

export enum CameraAngle {
  MEDIUM_SHOT = 'MS (Medium Shot): Từ ngực đến đầu, camera ngang tầm mắt.',
  FULL_SHOT = 'FS (Full Shot): Toàn thân từ đầu đến chân.',
  WIDE_SHOT = 'WS (Wide Shot): Nhân vật nhỏ, thấy nhiều không gian.',
  LOW_ANGLE = 'Góc dưới lên: Camera thấp, hướng lên → nhân vật trông mạnh, cao.',
  HIGH_ANGLE = 'Góc trên xuống: Camera cao, hướng xuống → nhân vật trông nhỏ, yếu.'
}

export enum Environment {
  TRUOC_CUA = 'Trước cửa nhà',
  PHONG_KHACH = 'Trong phòng khách',
  STUDIO = 'Studio chuyên nghiệp',
  DUONG_PHO = 'Đường phố Việt Nam',
  PHONG_THAY_DO = 'Trong phòng thay đồ',
  CHO_TET = 'Khu chợ ngày tết',
  VUON_HOA_HONG = 'Ngoài vườn hoa hồng',
  CAY_MAI_VANG = 'Đứng bên cạnh cây mai vàng to'
}

export enum ModelType {
  NORMAL = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}

export enum ImageQuality {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export interface GenerationConfig {
  pose: PoseStyle;
  cameraAngle: CameraAngle;
  environment: Environment;
  modelType: ModelType;
  quality: ImageQuality;
}

export interface HistoryItem {
  id: string;
  imageUrl: string;
  timestamp: number;
}
