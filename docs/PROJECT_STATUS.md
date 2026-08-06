# Trạng thái dự án

Cập nhật: 2026-08-06

## Tiến độ tổng thể: 86%

Tỷ lệ này đo mức sẵn sàng bàn giao/demo, không chỉ số lượng dòng code.

| Hạng mục | Hoàn thành | Ghi chú |
| --- | ---: | --- |
| Phạm vi, kiến trúc và database | 100% | Schema chuẩn hóa, migration và seed |
| Authentication và phân quyền | 100% | JWT, kiểm tra user active, Employee/Admin |
| Ticket và comment | 100% | CRUD cần thiết, filter, history và dashboard |
| Knowledge Base | 100% | Search, category, draft/publish/archive, Admin UI |
| Frontend MVP | 92% | Đủ luồng chính; còn kiểm tra responsive trên nhiều thiết bị |
| Kiểm thử và chất lượng | 78% | Có smoke test backend; chưa có component/E2E browser test |
| Tài liệu và kịch bản demo | 65% | README/dev log có sẵn; còn checklist và video/slide |
| Deploy production | 20% | Chưa chọn và cấu hình hosting |

## Đã có thể demo

1. Employee đăng nhập và đọc Knowledge Base.
2. Employee tạo ticket, xem trạng thái và bình luận.
3. Admin xem dashboard, nhận ticket và cập nhật quy trình xử lý.
4. Admin tạo hướng dẫn, giữ bản nháp hoặc xuất bản cho Employee.
5. Chạy `npm run test:smoke` để chứng minh các rule phân quyền.

## Việc còn lại để đạt 100%

1. Kiểm tra responsive và sửa lỗi giao diện trên desktop/mobile thật.
2. Thêm frontend error boundary, toast và trạng thái loading nhất quán.
3. Chọn môi trường deploy; cấu hình database, backend, frontend và CORS.
4. Kiểm thử bản deploy bằng dữ liệu demo.
5. Hoàn thiện slide, kịch bản demo, ảnh chụp và video dự phòng.

## Definition of Done

- Backend/frontend build và lint thành công.
- Smoke test chạy lại được và không để lại dữ liệu tạm.
- Luồng Employee/Admin chạy được trên URL deploy.
- Không commit `.env`, mật khẩu production hoặc `node_modules`.
- README đủ để một người khác setup từ repository mới.
- Có tài khoản demo, slide và kịch bản trình bày end-to-end.
