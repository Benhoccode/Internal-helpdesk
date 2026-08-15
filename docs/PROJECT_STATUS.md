# Trạng thái dự án

Cập nhật: 2026-08-15

## Tiến độ tổng thể: 94%

Tỷ lệ này đo mức sẵn sàng bàn giao/demo. Toàn bộ code thuộc phạm vi MVP đã hoàn
thành; phần còn lại chủ yếu là thao tác trên tài khoản hosting và tư liệu báo cáo.

| Hạng mục | Hoàn thành | Ghi chú |
| --- | ---: | --- |
| Phạm vi, kiến trúc và database | 100% | Schema chuẩn hóa, migration, seed và tài liệu ERD |
| Authentication và phân quyền | 100% | JWT, user active, Employee/Admin |
| Ticket, comment và dashboard | 100% | Filter, pagination, history và thống kê |
| Knowledge Base | 100% | Search, category, draft/publish/archive, Admin UI |
| Frontend MVP | 95% | Đủ luồng chính và responsive cơ bản |
| Kiểm thử và chất lượng | 85% | Smoke test API; build/lint; chưa có browser E2E |
| Tài liệu và kịch bản demo | 100% | README, kiến trúc, deploy, demo, khung báo cáo |
| Deploy production | 65% | Cấu hình sẵn Render/Vercel; chưa tạo URL trên tài khoản thật |

## Đã hoàn thành trong repository

1. Employee đăng nhập, đọc/tìm/lọc Knowledge Base.
2. Employee tạo, xem và bình luận ticket của mình.
3. Admin xem dashboard, lọc ticket, phân công và cập nhật trạng thái.
4. Admin tạo/sửa, lưu draft, publish hoặc archive bài viết.
5. Backend kiểm tra quyền và validation; frontend bảo vệ route theo role.
6. Smoke test 12 trường hợp có thể chạy lặp lại và tự dọn dữ liệu.
7. Cấu hình Render/Vercel và checklist kiểm tra production.
8. Kịch bản demo và khung báo cáo bám sát sản phẩm thật.

## Việc còn lại để đạt 100%

1. Đẩy repository lên GitHub.
2. Tạo PostgreSQL cloud, Render service và Vercel project theo `DEPLOYMENT.md`.
3. Chạy seed trên database demo và kiểm tra end-to-end bằng hai tài khoản.
4. Chụp ảnh, quay video demo dự phòng và đưa URL thật vào báo cáo.
5. Nếu còn thời gian: bổ sung browser E2E test; đây không phải điều kiện chặn MVP.

## Definition of Done

- [x] Backend/frontend build và lint thành công.
- [x] Smoke test chạy lại được và không để lại dữ liệu tạm.
- [x] Không commit `.env`, mật khẩu production hoặc `node_modules`.
- [x] README đủ để setup từ repository mới.
- [x] Có tài liệu kiến trúc, triển khai, demo và báo cáo.
- [ ] Luồng Employee/Admin chạy được trên URL production.
- [ ] Có ảnh chụp và video demo dự phòng.

## Cách hiểu tỷ lệ

- **100% phạm vi MVP trong code:** không còn chức năng P0/P1 bắt buộc phải viết.
- **94% sẵn sàng bàn giao:** thiếu triển khai trên tài khoản thật và tư liệu trình bày.
- Các tính năng như upload, email, SLA và AI là hướng phát triển, không dùng để kéo
  giảm tỷ lệ hoàn thành của MVP đã chốt.
