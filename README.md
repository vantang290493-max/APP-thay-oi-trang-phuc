
# 🚀 Hướng dẫn triển khai Elite Studio AI

Ứng dụng này được thiết kế để hoạt động mượt mà trên các nền tảng hosting hiện đại như **Vercel**, **Netlify** hoặc **GitHub Pages**.

## 🛠 Bước 1: Chuẩn bị API Key
Ứng dụng yêu cầu một API Key từ **Google AI Studio** để hoạt động.
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Tạo một API Key mới.
3. **Quan trọng:** Nếu bạn sử dụng tính năng "Nano Banana Pro" (Gemini 3 Pro), hãy đảm bảo tài khoản của bạn đã được liên kết với một dự án Google Cloud có bật thanh toán (Billing).

## 📦 Bước 2: Triển khai lên Vercel (Khuyên dùng)
1. Đẩy toàn bộ mã nguồn của bạn lên một kho lưu trữ (Repository) trên **GitHub**.
2. Truy cập [Vercel](https://vercel.com/) và đăng nhập bằng GitHub.
3. Chọn **"Add New"** -> **"Project"** và nhập Repository của bạn.
4. Trong phần **Environment Variables**, hãy thêm:
   - **Key:** `API_KEY`
   - **Value:** (Dán API Key bạn đã tạo ở Bước 1 vào đây)
5. Nhấn **"Deploy"**.

## 📦 Bước 3: Triển khai lên Netlify
1. Đẩy code lên GitHub.
2. Truy cập [Netlify](https://www.netlify.com/) -> **"Add new site"** -> **"Import from Git"**.
3. Trong phần cấu hình Build:
   - **Build Command:** `npm run build`
   - **Publish directory:** `dist`
4. Vào mục **Site settings** -> **Environment variables** và thêm `API_KEY`.

## ⚠️ Lưu ý bảo mật
- Không bao giờ dán trực tiếp API Key vào mã nguồn (`App.tsx` hoặc `geminiService.ts`).
- Luôn sử dụng biến môi trường thông qua `process.env.API_KEY` như cấu trúc hiện tại của ứng dụng.

---
**Phát triển bởi:** Nguyễn Văn Tặng
**Phiên bản:** 1.0.2 - Absolute Hair Lock & Seductive Pose Engaged
