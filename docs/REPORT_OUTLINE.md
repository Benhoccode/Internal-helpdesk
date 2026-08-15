# Khung báo cáo thực tập

Khung này bám sát những gì dự án đã thực sự triển khai. Không mô tả upload, email,
AI hoặc SLA như chức năng đã hoàn thành.

## Chương 1. Tổng quan đề tài

### 1.1 Bối cảnh

Trình bày việc yêu cầu hỗ trợ nội bộ thường đi qua chat/email, dễ thất lạc, khó
theo dõi trạng thái; tài liệu xử lý phân tán khiến cùng một lỗi bị hỏi nhiều lần.

### 1.2 Lý do chọn đề tài

Hệ thống Helpdesk & Knowledge Base giải quyết một bài toán có người dùng rõ ràng,
có luồng nghiệp vụ end-to-end và phù hợp để áp dụng frontend, backend, database,
authentication, authorization và deployment.

### 1.3 Mục tiêu

- Quản lý tập trung yêu cầu hỗ trợ.
- Phân biệt quyền Employee/Admin.
- Theo dõi tiến độ và trao đổi trong ticket.
- Lưu trữ, tìm kiếm và xuất bản hướng dẫn nội bộ.
- Cung cấp thống kê cơ bản và triển khai được bản demo.

### 1.4 Phạm vi MVP

Nêu chức năng đã có và các nội dung nằm ngoài phạm vi: upload, email, real-time,
reset password, SLA, mobile app và AI chatbot.

## Chương 2. Cơ sở lý thuyết và công nghệ

### 2.1 Mô hình client-server và REST API

Giải thích request/response HTTP, JSON, status code và phân tách frontend/backend.

### 2.2 Công nghệ

- React, TypeScript, Vite và React Router.
- Node.js, Express, Zod.
- PostgreSQL, Prisma ORM và migration.
- JWT và bcrypt.
- Git/GitHub, Render và Vercel.

Nêu lý do chọn: stack TypeScript xuyên suốt, phù hợp học trong thời gian thực tập,
PostgreSQL bảo đảm dữ liệu quan hệ và Prisma giúp migration có lịch sử.

## Chương 3. Phân tích yêu cầu

### 3.1 Tác nhân

- Employee: tìm bài viết, tạo/xem/bình luận ticket của mình.
- Admin: xem toàn bộ ticket, phân công/xử lý và quản lý bài viết/category.

### 3.2 Yêu cầu chức năng

Lập bảng mã FR-01…FR-n cho login, ticket, comment, dashboard và Knowledge Base;
ghi actor, đầu vào, kết quả và mức ưu tiên P0/P1.

### 3.3 Yêu cầu phi chức năng

- Password được hash; secret không đưa lên Git.
- Backend luôn kiểm tra quyền.
- Validation đầu vào và error response nhất quán.
- Giao diện responsive cơ bản.
- Dữ liệu lưu trong PostgreSQL và migration có thể chạy lại.

### 3.4 Use case và luồng nghiệp vụ

Vẽ use case tổng quát và sequence cho hai luồng:

1. Employee login → tìm KB → tạo ticket → bình luận.
2. Admin login → nhận ticket → cập nhật status → publish article.

## Chương 4. Thiết kế hệ thống

### 4.1 Kiến trúc

Dùng sơ đồ trong `docs/ARCHITECTURE.md`, giải thích từng lớp và chiều dữ liệu.

### 4.2 Thiết kế database

Đưa ERD, mô tả bảng và khóa. Nhấn mạnh:

- Quan hệ nhiều-nhiều Article–Category qua `ArticleCategory`.
- `TicketStatusHistory` lưu audit trail.
- Index cho trường lọc/khóa ngoại.
- Restrict/SetNull/Cascade được chọn theo ý nghĩa từng quan hệ.

### 4.3 Thiết kế API và phân quyền

Đưa bảng endpoint từ README; thêm request/response mẫu cho login, tạo ticket và
cập nhật ticket. Có ma trận quyền Employee/Admin.

### 4.4 Thiết kế giao diện

Đưa wireframe hoặc ảnh Login, Dashboard, danh sách, tạo/chi tiết ticket, Knowledge
Base và quản lý bài viết. Nêu design system: màu xanh chủ đạo, card, badge trạng
thái và responsive navigation.

## Chương 5. Xây dựng và triển khai

### 5.1 Backend

Trình bày cấu trúc route/controller/middleware/validator, Prisma adapter, JWT,
transaction khi tạo ticket và thay đổi status.

### 5.2 Frontend

Trình bày protected route, AuthProvider, API client, app shell và cách các trang
dùng API thật. Chọn một luồng để đưa code ngắn, không chép toàn bộ source.

### 5.3 Database migration và seed

Mô tả lệnh `db:migrate`, `db:deploy`, `db:seed` và hai tài khoản demo.

### 5.4 Triển khai

Mô tả PostgreSQL cloud → Render API → Vercel SPA, biến môi trường và CORS. Chèn
URL production và ảnh health check sau khi deploy thật.

## Chương 6. Kiểm thử và đánh giá

### 6.1 Phương pháp

- Backend build và Prisma validate.
- API smoke test tự động 12 trường hợp.
- Frontend ESLint và production build.
- Manual test hai role trên desktop/mobile.

### 6.2 Bảng test case

Tạo bảng: ID, chức năng, dữ liệu, bước thực hiện, kết quả mong đợi, kết quả thực tế,
trạng thái. Ít nhất gồm login đúng/sai, thiếu token, employee bị từ chối update,
ticket history, draft visibility và publish article.

### 6.3 Kết quả

Ghi output test/build, số test đạt và ảnh minh họa. Không tuyên bố load/security
test nếu chưa thực hiện.

## Chương 7. Kết quả, hạn chế và hướng phát triển

### 7.1 Kết quả đạt được

Đối chiếu từng mục tiêu ở Chương 1 với chức năng hoạt động, không chỉ liệt kê code.

### 7.2 Hạn chế

- Chưa có attachment/object storage.
- Chưa có notification/email và password reset.
- Chưa có refresh token hoặc cookie session.
- Chưa có E2E browser/component test và đo tải.
- Dashboard và SLA còn cơ bản.

### 7.3 Hướng phát triển

Ưu tiên attachment → notification → password/account management → E2E test → SLA
và metrics. AI gợi ý bài viết chỉ nên làm sau khi dữ liệu kiến thức đủ chất lượng.

## Kết luận

Tóm tắt bài toán, sản phẩm hoàn thành, kiến thức học được và giá trị thực tế. Nêu
trung thực rằng đây là MVP có thể mở rộng, không phải hệ thống helpdesk enterprise.

## Danh sách hình nên chụp ngày mai

1. Kiến trúc tổng quan.
2. ERD trong Prisma hoặc công cụ database.
3. Login.
4. Dashboard Admin.
5. Danh sách và bộ lọc ticket.
6. Form tạo ticket.
7. Chi tiết ticket, comment và status history.
8. Knowledge Base Employee.
9. Quản lý bài viết Admin.
10. Terminal smoke test đạt và health check production.
