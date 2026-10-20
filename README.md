# Internal Helpdesk & Knowledge Base

Ứng dụng web quản lý yêu cầu hỗ trợ nội bộ và kho kiến thức dùng chung. Nhân viên
có thể tìm hướng dẫn hoặc gửi yêu cầu; quản trị viên tiếp nhận, trao đổi, cập nhật
tiến độ và xuất bản bài viết hướng dẫn.

## Công nghệ

- Frontend: React 19, TypeScript, Vite, React Router, Lucide React
- Backend: Node.js 24, Express 5, TypeScript, Zod
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT, bcryptjs
- Deployment: Vercel, Render và PostgreSQL cloud

## Cấu trúc

```text
internal-helpdesk/
|-- client/        # React SPA
|-- server/        # Express REST API, Prisma migration và seed
|-- render.yaml    # Render Blueprint cho backend
`-- README.md
```

## Chạy local

Yêu cầu: Node.js 24, npm và PostgreSQL.

### 1. Backend

```powershell
cd C:\dev\internal-helpdesk\server
npm install
Copy-Item .env.example .env
```

Điền chuỗi kết nối PostgreSQL và JWT secret trong `server/.env`, sau đó chạy:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

API mặc định chạy tại `http://localhost:3000`. Health check:
`http://localhost:3000/api/health`.

Tài khoản mẫu do seed tạo:

- Admin: `admin@helpdesk.local` / `Admin@123`
- Employee: `employee@helpdesk.local` / `Employee@123`

Chỉ dùng các mật khẩu trên trong môi trường local hoặc demo.

### 2. Frontend

Mở terminal khác:

```powershell
cd C:\dev\internal-helpdesk\client
npm install
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` trong `client/.env` mặc định là `http://localhost:3000/api`.
Mở URL do Vite hiển thị, thường là `http://localhost:5173`.

## Kiểm tra chất lượng

```powershell
cd C:\dev\internal-helpdesk\server
npm run db:validate
npm run build
npm run test:smoke

cd C:\dev\internal-helpdesk\client
npm run lint
npm run build
```

Smoke test khởi động API trên một cổng ngẫu nhiên và kiểm tra authentication, phân
quyền, ticket, comment, dashboard và Knowledge Base. Dữ liệu tạm được tự động dọn
sau mỗi lần chạy.

## API chính

| Method | Endpoint | Quyền |
| --- | --- | --- |
| POST | `/api/auth/login` | Công khai |
| GET | `/api/auth/me` | Đã đăng nhập |
| GET | `/api/categories` | Đã đăng nhập |
| POST | `/api/categories` | Admin |
| GET | `/api/dashboard/statistics` | Theo phạm vi của người dùng |
| GET | `/api/articles` | Employee thấy bài published; Admin thấy tất cả |
| GET | `/api/articles/:slug` | Theo quyền hiển thị bài viết |
| POST | `/api/articles` | Admin |
| PATCH | `/api/articles/:slug` | Admin |
| POST | `/api/tickets` | Đã đăng nhập |
| GET | `/api/tickets` | Employee xem của mình; Admin xem tất cả |
| GET | `/api/tickets/:id` | Chủ ticket hoặc Admin |
| PATCH | `/api/tickets/:id` | Admin |
| POST | `/api/tickets/:id/comments` | Chủ ticket hoặc Admin |
| GET/POST | `/api/tickets/:id/attachments` | Chủ ticket hoặc Admin |
| GET | `/api/tickets/:id/attachments/:attachmentId/preview` | Chủ ticket hoặc Admin; PNG/JPG |
| GET | `/api/tickets/:id/attachments/:attachmentId/download` | Chủ ticket hoặc Admin |
| GET | `/api/notifications?page=1` | Chỉ thông báo của người đang đăng nhập |
| PATCH | `/api/notifications/:id/read` | Chủ thông báo |
| PATCH | `/api/notifications/read-all` | Chỉ thông báo của người đang đăng nhập |
| GET/POST | `/api/users` | Admin |
| GET | `/api/users/assignees` | Admin; chỉ người hỗ trợ đang hoạt động |
| PATCH | `/api/users/:id/active` | Admin; không tự khóa chính mình |
| POST | `/api/users/:id/reset-password` | Admin; không dùng cho chính mình |
| POST | `/api/auth/change-password` | Đã đăng nhập; yêu cầu mật khẩu hiện tại |

Danh sách ticket hỗ trợ `status`, `priority`, `categoryId`, `search`, `page` và
`limit` dưới dạng query parameter.

## Quy trình hỗ trợ và tài khoản

- Trạng thái đi theo `OPEN → IN_PROGRESS → RESOLVED → CLOSED`.
- `RESOLVED` hoặc `CLOSED` có thể mở lại về `IN_PROGRESS`. Đóng giữ nguyên ngày
  giải quyết; mở lại xóa ngày giải quyết để ghi nhận lần xử lý tiếp theo.
- Thông báo trong ứng dụng được kiểm tra mỗi 30 giây khi tab đang hiển thị và khi
  mở chuông. Chưa có email/push/WebSocket.
- Ticket mới thông báo cho các admin; phân công, đổi trạng thái và bình luận gửi
  cho người tạo và người xử lý (hoặc các admin khi chưa phân công). Không gửi cho
  chính người thực hiện. Các thông báo và thay đổi ticket được lưu cùng transaction.
- Quản lý tài khoản: tạo, tìm kiếm, khóa/mở khóa, đặt lại mật khẩu. Vai trò Admin
  hiện bao gồm hỗ trợ và quản trị; chưa tách riêng nhóm Support.
- Mật khẩu mới từ 12 ký tự, tối đa 72 byte UTF-8. Khóa/mở khóa, đặt lại hoặc đổi
  mật khẩu thu hồi các JWT cũ qua `token_version`. Giao mật khẩu ban đầu qua kênh
  riêng; hệ thống chưa bắt buộc đổi mật khẩu ở lần đăng nhập đầu.

## Cập nhật bản đang chạy

Sao lưu database trước khi cập nhật. Trong `server`, chạy `npm run db:deploy` rồi
`npm run build` và khởi động lại. Migration bổ sung bảng `notifications` và cột
`users.token_version`; không reset dữ liệu. Render Blueprint đã chạy migration
trong start command. Không chạy lại seed trên production để tránh đổi tài khoản demo.

Đính kèm cần `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
trên backend; không đặt secret trong biến `VITE_`.

## Kiểm thử mở rộng

Trong `server`:

```powershell
npm run test:attachments
npm run test:workflow
npm run test:operations
```

`test:operations` chỉ chấp nhận PostgreSQL local. Tài khoản database phải có quyền
tạo database: test tự tạo một database riêng, áp dụng toàn bộ migration, kiểm tra
API rồi xóa database thử; không migrate/seed database ứng dụng.

Có thể chạy thêm browser test nếu đã cài Playwright và Microsoft Edge:

```powershell
$env:BROWSER_TESTS = "1"
npm run test:operations
```

Dùng `PLAYWRIGHT_MODULE_PATH` nếu Playwright nằm ngoài node_modules của dự án.
Browser test dùng cổng 5191 và API/database thử, không dùng dịch vụ production.
