# Hướng dẫn triển khai

Phương án đề xuất cho bản demo:

- Frontend React: Vercel
- Backend Express: Render, region Singapore
- Database: PostgreSQL cloud (Neon, Render PostgreSQL hoặc dịch vụ tương đương)

Repository đã có `render.yaml` cho backend và `client/vercel.json` để React Router
hoạt động khi mở trực tiếp một URL con.

## 1. Chuẩn bị repository

Tạo repository GitHub và đẩy nhánh `main`. Không commit bất kỳ file `.env` nào.

```powershell
cd C:\dev\internal-helpdesk
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

Nếu `origin` đã tồn tại thì không chạy lại `git remote add`.

## 2. Tạo PostgreSQL cloud

1. Tạo database và sao chép connection string dạng PostgreSQL.
2. Ưu tiên connection string trực tiếp khi chạy Prisma migration.
3. Lưu chuỗi này làm biến `DATABASE_URL` trên Render; không ghi vào mã nguồn.
4. Bật SSL theo yêu cầu của nhà cung cấp, thường nằm sẵn trong connection string.

Migration production dùng lệnh không tương tác:

```powershell
npm run db:deploy
```

`render.yaml` đã đặt lệnh này trước khi khởi động API.

## 3. Deploy backend trên Render

### Cách dùng Blueprint

1. Trong Render chọn **New > Blueprint** và kết nối GitHub repository.
2. Render đọc `render.yaml` ở thư mục gốc.
3. Nhập `DATABASE_URL` và `CLIENT_URL` khi được hỏi.
4. Lần đầu có thể tạm đặt `CLIENT_URL` thành URL frontend dự kiến; sau khi Vercel
   cấp URL chính xác, cập nhật lại và redeploy.

Cấu hình được khai báo sẵn:

| Trường | Giá trị |
| --- | --- |
| Root directory | `server` |
| Build command | `npm ci && npm run build` |
| Start command | `npm run db:deploy && npm start` |
| Health check | `/api/health` |
| Node | `24.14.1` |

Render tự sinh `JWT_SECRET`. Không sao chép secret này vào repository.

### Seed dữ liệu demo

Chỉ seed database dùng để trình diễn, không seed môi trường thực tế:

```powershell
npm run db:seed
```

Seed tạo mật khẩu đã biết trước, vì vậy phải đổi hoặc xóa tài khoản mẫu nếu hệ
thống được dùng ngoài mục đích demo.

Kiểm tra backend:

```text
https://<render-service>.onrender.com/api/health
```

Kết quả mong đợi có `"status":"ok"`.

## 4. Deploy frontend trên Vercel

1. Import cùng GitHub repository vào Vercel.
2. Đặt **Root Directory** là `client`.
3. Framework preset: Vite.
4. Thêm biến môi trường:

```text
VITE_API_URL=https://<render-service>.onrender.com/api
```

5. Deploy và ghi lại URL production, ví dụ `https://<project>.vercel.app`.

Sau đó quay lại Render, đặt `CLIENT_URL` đúng bằng origin của Vercel, không có
dấu `/` cuối, rồi redeploy backend.

## 5. Checklist sau deploy

- [ ] `/api/health` trả HTTP 200.
- [ ] Trang login mở được và refresh tại route con không trả 404.
- [ ] Admin và Employee đăng nhập được bằng tài khoản demo.
- [ ] Employee tạo ticket và chỉ thấy ticket của mình.
- [ ] Admin thấy ticket, nhận xử lý, cập nhật trạng thái và bình luận.
- [ ] Employee đọc được bài published nhưng không truy cập trang quản trị.
- [ ] Admin tạo draft, publish bài và Employee tìm thấy bài đó.
- [ ] DevTools không báo lỗi CORS hoặc mixed content.
- [ ] Không có `.env`, database URL hay JWT secret trong GitHub.

## 6. Xử lý lỗi thường gặp

| Hiện tượng | Kiểm tra |
| --- | --- |
| CORS error | `CLIENT_URL` phải khớp chính xác origin Vercel |
| Frontend gọi localhost | Kiểm tra `VITE_API_URL`, sau đó redeploy frontend |
| Backend không khởi động | Xem Render logs và kiểm tra `DATABASE_URL` |
| Migration lỗi | Dùng connection trực tiếp, quyền tạo bảng và SSL setting |
| Refresh route bị 404 | Kiểm tra `client/vercel.json` có SPA rewrite |
| Login demo thất bại | Chạy seed một lần trên database demo |

## 7. Rollback đơn giản

Nếu bản deploy mới lỗi, chọn deployment ổn định trước đó trên Render/Vercel để
rollback. Không rollback migration bằng cách xóa bảng; sửa schema bằng migration
mới để lịch sử database vẫn nhất quán.
