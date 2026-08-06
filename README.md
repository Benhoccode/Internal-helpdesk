# Internal Helpdesk & Knowledge Base

MVP quản lý yêu cầu hỗ trợ nội bộ, được xây dựng để học React, Node.js,
REST API và PostgreSQL qua một luồng nghiệp vụ thực tế.

## Công nghệ

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT, bcryptjs
- Validation: Zod

## Cấu trúc

```text
internal-helpdesk/
|-- client/   # React application
|-- server/   # Express REST API and Prisma
`-- docs/     # Nhật ký và tài liệu kỹ thuật
```

## Chạy local

Yêu cầu: Node.js, npm và PostgreSQL đã được cài đặt.

### 1. Backend

```powershell
cd C:\dev\internal-helpdesk\server
npm install
Copy-Item .env.example .env
```

Điền kết nối PostgreSQL và JWT secret trong `.env`, sau đó chạy:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

API mặc định chạy tại `http://localhost:3000`.

Tài khoản mẫu do seed tạo:

- Admin: `admin@helpdesk.local` / `Admin@123`
- Employee: `employee@helpdesk.local` / `Employee@123`

Chỉ sử dụng các mật khẩu trên cho môi trường local.

### 2. Frontend

Mở terminal khác:

```powershell
cd C:\dev\internal-helpdesk\client
npm install
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` trong `client/.env` phải trỏ tới backend, mặc định là
`http://localhost:3000/api`.

## Kiểm thử

Sau khi PostgreSQL đã migrate và seed, chạy bộ kiểm thử tích hợp:

```powershell
cd C:\dev\internal-helpdesk\server
npm run test:smoke
```

Test khởi động API trên một cổng ngẫu nhiên, kiểm tra auth, phân quyền, ticket,
comment, dashboard và Knowledge Base. Mọi ticket/bài viết tạm được xóa trong
`finally`, kể cả khi một assertion thất bại.

## API hiện có

| Method | Endpoint | Quyền |
| --- | --- | --- |
| POST | `/api/auth/login` | Công khai |
| GET | `/api/auth/me` | Đã đăng nhập |
| GET | `/api/categories` | Đã đăng nhập |
| POST | `/api/categories` | Admin |
| GET | `/api/dashboard/statistics` | Đã đăng nhập; thống kê theo phạm vi quyền |
| GET | `/api/articles` | Employee thấy bài published; Admin thấy tất cả |
| GET | `/api/articles/:slug` | Theo quyền hiển thị bài viết |
| POST | `/api/articles` | Admin |
| PATCH | `/api/articles/:slug` | Admin |
| POST | `/api/tickets` | Đã đăng nhập |
| GET | `/api/tickets` | Employee xem của mình; Admin xem tất cả |
| GET | `/api/tickets/:id` | Chủ ticket hoặc Admin |
| PATCH | `/api/tickets/:id` | Admin |
| POST | `/api/tickets/:id/comments` | Chủ ticket hoặc Admin |

Danh sách ticket hỗ trợ `status`, `priority`, `categoryId`, `search`, `page`
và `limit` dưới dạng query parameters.

Xem lịch sử triển khai tại [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md).
Tiến độ bàn giao được theo dõi tại [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).
