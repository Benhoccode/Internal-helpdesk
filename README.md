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

Danh sách ticket hỗ trợ `status`, `priority`, `categoryId`, `search`, `page` và
`limit` dưới dạng query parameter.
