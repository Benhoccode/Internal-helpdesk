# Kịch bản demo 5–7 phút

## Chuẩn bị trước buổi demo

- Backend, frontend và PostgreSQL đang chạy.
- Đã chạy migration và seed.
- Mở hai cửa sổ trình duyệt hoặc một cửa sổ thường và một cửa sổ ẩn danh.
- Chuẩn bị tài khoản Employee và Admin.
- Xóa ticket thử không cần thiết hoặc ghi trước ID ticket sẽ dùng.
- Mở sẵn trang health check làm phương án chứng minh API đang hoạt động.

## Câu chuyện demo

### 1. Giới thiệu vấn đề — 30 giây

“Nhân viên thường gửi lỗi qua tin nhắn nên yêu cầu dễ thất lạc, còn cách khắc phục
nằm rải rác. Hệ thống kết hợp ticket và kho kiến thức để chuẩn hóa quy trình này.”

### 2. Employee tự tìm hướng dẫn — 45 giây

1. Đăng nhập bằng `employee@helpdesk.local`.
2. Mở **Cơ sở kiến thức**.
3. Tìm từ khóa `VPN`, lọc category nếu cần và mở bài hướng dẫn.
4. Giải thích rằng Employee chỉ thấy bài đã xuất bản.

### 3. Employee tạo yêu cầu — 60 giây

Tạo ticket:

```text
Tiêu đề: Không thể kết nối VPN công ty
Danh mục: Network / VPN
Ưu tiên: High
Mô tả: VPN báo authentication failed. Đã kiểm tra Internet và khởi động lại máy
nhưng lỗi vẫn còn. Cần truy cập hệ thống nội bộ để hoàn thành công việc.
```

Mở ticket vừa tạo và chỉ ra trạng thái `OPEN`, người tạo, category và lịch sử.

### 4. Admin tiếp nhận — 90 giây

1. Chuyển sang cửa sổ Admin, đăng nhập bằng `admin@helpdesk.local`.
2. Dashboard hiển thị ticket mới trong thống kê và danh sách gần đây.
3. Mở ticket, tự nhận xử lý, đặt `IN_PROGRESS` và giữ priority `HIGH`.
4. Bình luận: “Vui lòng xác nhận thời điểm đổi mật khẩu gần nhất.”
5. Chỉ ra status history ghi lại người thay đổi và thời gian.

### 5. Hai bên trao đổi và giải quyết — 60 giây

1. Employee refresh chi tiết ticket và trả lời bằng comment.
2. Admin cập nhật ticket thành `RESOLVED` và thêm ghi chú xử lý.
3. Nhấn mạnh Employee không thể tự sửa status hoặc assignee; backend trả `403`
   nếu cố gọi API, không chỉ ẩn nút trên giao diện.

### 6. Knowledge Base khép kín vòng lặp — 60 giây

1. Admin mở **Quản lý bài viết** và tạo bài ở trạng thái `DRAFT`.
2. Cho thấy Employee chưa nhìn thấy draft.
3. Admin chuyển bài thành `PUBLISHED`.
4. Employee tìm thấy bài mới trong Knowledge Base.

Kết luận: vấn đề mới đi vào ticket, được xử lý và có thể trở thành kiến thức tái
sử dụng, giúp giảm yêu cầu lặp lại.

## Điểm kỹ thuật nên nói khi được hỏi

- React SPA gọi REST API Express bằng JSON.
- JWT xác thực; middleware đọc lại user active và role từ PostgreSQL.
- Prisma quản lý schema/migration; PostgreSQL lưu dữ liệu thật.
- `ArticleCategory` là bảng nối nhiều-nhiều; status history phục vụ audit.
- Smoke test bao phủ 12 trường hợp và tự dọn dữ liệu thử.

## Phương án dự phòng

- Quay trước video toàn bộ luồng demo.
- Chụp ảnh Login, Dashboard, Ticket detail, Knowledge Base và Admin article form.
- Nếu frontend lỗi, dùng health check và Postman để chứng minh API.
- Nếu mạng lỗi, chạy toàn bộ bản local và không thay đổi `.env` ngay trước demo.
