# Development log

Tài liệu này ghi lại những phần Codex đã triển khai để có thể review theo từng
mốc, thay vì chỉ nhìn vào kết quả cuối cùng.

## 2026-08-05 - Nền tảng database và authentication

### Đã làm

- Chuẩn hóa schema PostgreSQL qua Prisma cho User, Category, Ticket,
  TicketComment, TicketStatusHistory, Article và ArticleCategory.
- Tách quan hệ nhiều-nhiều Article - Category thành bảng nối ArticleCategory.
- Thêm index cho các trường thường lọc và khóa ngoại có chính sách xóa rõ ràng.
- Tạo migration đầu tiên và seed 1 admin, 1 employee, 4 category.
- Cấu hình Express, biến môi trường, Prisma PostgreSQL adapter và health check.
- Triển khai JWT login, lấy thông tin người đang đăng nhập, middleware xác thực,
  middleware phân quyền, validation và error handler chung.

### Quyết định

- Không lưu password thuần; database chỉ lưu `passwordHash`.
- Token chứa user id và role; middleware đọc lại user từ database trên mỗi
  request để phát hiện tài khoản bị vô hiệu hóa và dùng role hiện tại.
- `.env` không được commit; `.env.example` chỉ chứa giá trị mẫu.

### Kiểm tra

- Prisma migration và seed thành công.
- Backend và frontend build thành công.
- Health, login, `/auth/me`, sai mật khẩu và thiếu token đã được kiểm thử.

## 2026-08-05 - Category, Ticket và Comment API

### Đã làm

- Category: lấy danh sách và tạo category mới; tên trùng không phân biệt hoa
  thường trả về `409`.
- Ticket: tạo, lấy danh sách, lọc/tìm kiếm/phân trang, lấy chi tiết và cập nhật.
- Comment: thêm trao đổi vào ticket.
- Ticket detail trả về category, creator, assignee, comments và status history.
- Validation cho path parameter, request body và query parameter bằng Zod.

### Quy tắc nghiệp vụ

- Employee chỉ đọc và bình luận ticket do chính mình tạo.
- Admin đọc tất cả ticket và là vai trò duy nhất được cập nhật trạng thái,
  priority, category hoặc assignee.
- Assignee phải là admin đang hoạt động.
- Tạo ticket và bản ghi lịch sử `null -> OPEN` nằm trong cùng transaction.
- Đổi trạng thái ticket và thêm lịch sử cũng nằm trong cùng transaction.
- `resolvedAt` được đặt khi chuyển sang `RESOLVED` và xóa nếu mở lại.
- MVP không xóa ticket qua API; ticket được đóng bằng trạng thái `CLOSED` để giữ
  dấu vết nghiệp vụ.
- MVP cho phép admin chuyển giữa các trạng thái; lịch sử giúp audit. State
  transition nghiêm ngặt có thể bổ sung sau khi công ty xác nhận quy trình.

### Kiểm tra tự động qua HTTP

- `GET /api/health`: `ok`.
- Employee và admin đăng nhập thành công.
- Đọc được 4 category seed.
- Employee tạo ticket `OPEN` và nhìn thấy ticket trong danh sách của mình.
- Admin lọc thấy ticket mở, gán cho chính mình và chuyển sang `IN_PROGRESS`.
- Status history có 2 bản ghi sau lần chuyển trạng thái.
- Employee thêm comment thành công.
- Employee cập nhật ticket bị từ chối với HTTP `403`.
- Ticket test đã được xóa sau kiểm tra để không làm bẩn database.

## Việc tiếp theo đề xuất

1. Xây dựng Knowledge Base API cho Article và ArticleCategory.
2. Viết test có thể chạy lại bằng test runner thay cho smoke test thủ công.
3. Kết nối frontend: login, auth context và protected routes.
4. Làm trang danh sách/tạo/chi tiết ticket trước khi chăm chút giao diện.

## 2026-08-05 - Frontend MVP

### Đã làm

- Chuyển năm màn hình Stitch thành design system responsive dùng chung.
- Thêm React Router, Lucide icons, AuthProvider, protected routes và JWT session.
- Kết nối giao diện Login với `/auth/login` và `/auth/me`.
- Xây App Shell gồm sidebar, header, thông tin tài khoản và đăng xuất.
- Xây Dashboard, danh sách ticket, bộ lọc/phân trang, tạo ticket, chi tiết,
  bình luận, lịch sử trạng thái và điều khiển dành riêng cho Admin.
- Thêm `GET /api/dashboard/statistics`; Employee nhận số liệu ticket của mình,
  Admin nhận số liệu toàn hệ thống.
- Các chức năng chưa có backend như upload, thông báo, SLA và quên mật khẩu
  không được giả lập trong MVP.

### Quyết định giao diện

- Thống nhất thuật ngữ “Yêu cầu hỗ trợ” và mã hiển thị `#TK-0001`.
- Dùng font sans-serif, màu xanh `#2563EB`, nền sáng và card bo góc 12px.
- Responsive sidebar chuyển thành navigation drawer trên màn hình nhỏ.
- Knowledge Base hiện là placeholder rõ ràng cho mốc tiếp theo.

### Kiểm tra

- Backend TypeScript build thành công.
- Frontend ESLint và production build thành công.
- AST validator của skill xác nhận AppShell, StatusBadge và AuthProvider có
  props type-safe, không chứa màu hex hardcode trong component.
- Kiểm tra trình duyệt ở kích thước 1440 x 1000 xác nhận Login hiển thị đúng.
- Frontend dev server trả HTTP `200`; đăng nhập seed và Dashboard API hoạt động.
- `npm audit` còn 2 cảnh báo mức moderate từ React Router 6.30.4. Cảnh báo liên
  quan SSR hydration/open redirect; ứng dụng hiện là client-only SPA và chỉ điều
  hướng tới pathname nội bộ. Chưa có bản tương thích không bị npm cảnh báo.

## 2026-08-06 - Knowledge Base hoàn chỉnh

### Đã làm

- Thêm API lấy danh sách, tìm kiếm, lọc, phân trang và xem chi tiết bài viết.
- Thêm API tạo/cập nhật bài viết dành cho Admin, tự sinh slug không dấu và xử
  lý trùng slug.
- Bài viết hỗ trợ nhiều category qua bảng nối `ArticleCategory`.
- Seed hai hướng dẫn nội bộ đã xuất bản về VPN và cài đặt phần mềm.
- Thay placeholder Knowledge Base bằng danh sách card, tìm kiếm và lọc category.
- Thêm trang đọc bài viết, quản lý bài viết, tạo/chỉnh sửa và chọn nhiều category.
- Thêm `AdminRoute`; Employee không thể mở route quản lý ngay cả khi nhập URL.

### Quy tắc nghiệp vụ

- Employee chỉ nhìn thấy và đọc bài có trạng thái `PUBLISHED`.
- Admin có thể quản lý `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- MVP không xóa bài viết qua API; dùng `ARCHIVED` để giữ lịch sử nội dung.
- Slug được giữ ổn định khi đổi tiêu đề để các liên kết cũ không bị hỏng.
- `publishedAt` được đặt ở lần xuất bản đầu tiên và không bị ghi đè khi chỉnh sửa.

### Kiểm tra

- Backend và frontend production build thành công; frontend ESLint sạch.
- AST validator xác nhận ArticleCard và AdminRoute có props type-safe.
- Admin tạo draft thành công; Employee tìm kiếm nhận 0 kết quả và đọc trực tiếp
  nhận `404`.
- Sau khi Admin xuất bản, Employee tìm thấy bài viết.
- Bài smoke test đã xóa; database còn đúng 2 bài seed.

## 2026-08-06 - Repeatable API smoke test

### Đã làm

- Thêm `npm run test:smoke` dùng Node assert, fetch và server cổng ngẫu nhiên.
- Bao phủ 12 kiểm tra: health, login sai/đúng, `/auth/me`, tạo ticket, phân quyền
  cập nhật, status history, comment, dashboard, draft visibility, quyền tạo bài
  và xuất bản Knowledge Base.
- Dùng UUID trong tiêu đề để test có thể chạy nhiều lần hoặc song song mà không
  phụ thuộc id cố định.
- Cleanup ticket và article trong `finally`; database được xác nhận còn 0 ticket
  và 2 bài seed sau khi chạy.

### Kết quả

- Tất cả smoke test đạt.
- Các query chỉ đọc độc lập chạy bằng `Promise.all`; transaction vẫn chỉ dùng
  cho thao tác ghi cần tính nguyên tử. `pg` vẫn phát một deprecation warning từ
  bên trong `@prisma/adapter-pg` sau khi test nhưng không làm test hoặc cleanup
  thất bại; cần kiểm tra lại khi nâng Prisma/pg.
- Tiến độ sẵn sàng bàn giao được cập nhật thành 86% trong `PROJECT_STATUS.md`.
