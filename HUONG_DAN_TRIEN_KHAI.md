# Hướng dẫn triển khai MathSpeak Studio V4 (Next.js + Supabase + PWA)

Bộ mã nguồn này là ứng dụng Web Full-Stack hoàn chỉnh cho giáo viên Toán THPT: tải file giáo án `.docx`/`.txt`, sinh kịch bản giảng dạy tiếng Anh 4 hoạt động bằng Gemini AI (bảo mật API Key trên server), luyện đọc tách câu, **AI nghe ghi âm và chấm phát âm**, đồng bộ kho bài giảng trên **Supabase** và cài ra màn hình điện thoại như app thật (**PWA**).

---

## Bước 1: Tạo cơ sở dữ liệu miễn phí trên Supabase (3 phút)

1. Truy cập **supabase.com**, đăng nhập bằng tài khoản GitHub hoặc Google và bấm **New project**.
2. Đặt tên dự án (ví dụ: `mathspeak-studio`), chọn khu vực gần Việt Nam (**Singapore**), đặt mật khẩu DB rồi bấm **Create new project**.
3. Khi dự án tạo xong, vào mục **SQL Editor** (menu bên trái) -> bấm **New query** -> mở file `supabase/schema.sql` trong gói này, sao chép toàn bộ nội dung dán vào và bấm **Run**.
4. Vào **Project Settings -> API**, sao chép 2 giá trị:
   - `Project URL` -> dùng cho biến `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> dùng cho biến `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. *(Khuyên làm để đăng nhập nhanh)* Vào **Authentication -> Providers -> Email**, tắt tùy chọn **Confirm email** nếu thầy muốn giáo viên trong tổ đăng ký là dùng được ngay không cần mở mail xác nhận.

---

## Bước 2: Đưa web lên mạng miễn phí bằng Vercel (3 phút)

1. Giải nén file `mathspeak-studio-v4.zip` và tải thư mục `mathspeak-studio-v4` lên một kho mã nguồn **GitHub** mới (có thể để chế độ **Private**).
2. Truy cập **vercel.com**, đăng nhập bằng tài khoản GitHub -> bấm **Add New... -> Project** -> chọn kho `mathspeak-studio-v4`.
3. Tại mục **Environment Variables**, thêm 4 biến môi trường sau:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(Project URL lấy ở Bước 1)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(anon public key lấy ở Bước 1)*
   - `GEMINI_API_KEY` = *(API Key lấy tại aistudio.google.com/apikey)*
   - `GEMINI_MODEL` = `gemini-2.5-flash`
4. Bấm **Deploy** và đợi khoảng 1–2 phút. Vercel sẽ cấp ngay một đường link HTTPS dạng `https://mathspeak-studio-xxx.vercel.app`.

---

## Bước 3: Cài thành App trên điện thoại (PWA)

- **Trên iPhone (Safari):** Mở đường link Vercel bằng Safari -> bấm biểu tượng **Chia sẻ (Share)** ở cạnh dưới -> chọn **Thêm vào Màn hình chính (Add to Home Screen)**.
- **Trên Android (Chrome):** Mở đường link Vercel bằng Chrome -> bấm dấu **3 chấm** góc trên bên phải -> chọn **Cài đặt ứng dụng (Install app)**.

---

## Chạy thử trên máy tính cá nhân (nếu muốn)

```bash
cd mathspeak-studio-v4
cp .env.example .env.local
# Điền 4 biến môi trường vào file .env.local
npm install
npm run dev
```
Sau đó mở trình duyệt tại `http://localhost:3000`.
