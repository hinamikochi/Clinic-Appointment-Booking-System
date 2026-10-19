# Vận hành MyClinic — không tích hợp thanh toán

## Phạm vi

Phiếu hẹn, đổi lịch, tiếp nhận/vắng mặt, hồ sơ người khám, bản nháp bệnh án, lịch sử thay đổi, thông báo, khôi phục tài khoản và báo cáo. Phí khám là thông tin dự kiến; không có cổng thanh toán, đặt cọc hoặc thu tiền trực tuyến.

## Chạy bản mới

- Chạy `npm install` trong backend khi dependency thay đổi.
- Backend: `npm run migrate`, rồi `npm start`. Server cũng kiểm tra migration khi khởi động.
- Frontend: `npm run dev`; build bằng `npm run build`.
- Docker Desktop cần đang chạy trước `docker compose up --build -d`. Các biến môi trường được đọc từ `.env` tại thư mục gốc.

Migration `002_clinic_operations` thêm dữ liệu vận hành, phiên bản bản ghi và bảng thông báo. Tài khoản bác sĩ thiếu hồ sơ được bổ sung DoctorInfo ở trạng thái **ngừng nhận lịch**, chuyên khoa và phí để trống. Admin vào **Quản lý bác sĩ** để hoàn thiện rồi mở nhận lịch. Không tự đoán chuyên khoa và không xóa tài khoản cũ.

## Email giả và tài khoản thử nghiệm

- Tất cả tài khoản cũ tiếp tục đăng nhập được. Migration không xác minh email và không gửi thư.
- `SMTP_HOST` mặc định để trống. Khi đó chỉ có thông báo trong hệ thống, không có kết nối gửi email ra ngoài.
- Nhắc hẹn/xác nhận qua email chỉ gửi tới người dùng có `emailVerified=true`.
- Người dùng có thể đổi sang email thật trong **Hồ sơ → Email và khôi phục tài khoản**, nhập mật khẩu hiện tại rồi yêu cầu xác minh. Liên kết xác minh dùng một lần, hết hạn sau 30 phút.
- Quên mật khẩu qua email yêu cầu SMTP và email đã xác minh; API không tiết lộ email nào tồn tại.
- Với tài khoản dùng email giả và đã quên mật khẩu: admin xác minh danh tính bằng quy trình ngoài hệ thống, vào **Quản lý tài khoản → Khôi phục mật khẩu**. Mật khẩu tạm chỉ hiển thị ở phản hồi thao tác đó; chuyển trực tiếp cho đúng người dùng. Người dùng nên đổi mật khẩu ngay.
- Đổi/khôi phục mật khẩu hoặc khóa tài khoản làm mất hiệu lực các token đăng nhập cũ.

### Bật SMTP khi sẵn sàng

Điền các biến trong file `.env` tương ứng; không commit mật khẩu:

```dotenv
PUBLIC_APP_URL=http://localhost:8080
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Dùng cấu hình do nhà cung cấp email cung cấp. Port 465 thường dùng `SMTP_SECURE=true`; port 587 dùng nâng cấp STARTTLS. Không tắt kiểm tra chứng chỉ TLS. Backend dùng Nodemailer, hàng đợi trong database và retry có giới hạn. Báo cáo admin hiển thị trạng thái cấu hình/số thư lỗi. Không ghi token khôi phục ra console hoặc hiển thị cho admin.

## Thông tin phòng khám

Đặt `CLINIC_NAME`, `CLINIC_ADDRESS`, `CLINIC_PHONE`, `CLINIC_INSTRUCTIONS` để phiếu hẹn và bản in hiển thị đúng cơ sở của bạn. Địa chỉ và số điện thoại trống sẽ không được thay bằng thông tin mẫu.

## Lịch hẹn và ngoại lệ

- Tạo lịch mới ở trạng thái `pending`. Chỉ thông báo **đã nhận yêu cầu**, chưa khẳng định lịch đã được duyệt.
- Luồng thường: `pending → confirmed → arrived → in_progress → completed`.
- Có thể lưu kết quả từ ca đã xác nhận/tiếp nhận sau giờ bắt đầu; backend vẫn bảo vệ quyền bác sĩ phụ trách.
- Hủy cần lý do; lịch chờ/đã xác nhận có thể đổi trước giờ khám.
- Đổi lịch giữ chỗ cũ nếu chỗ mới không còn trống. Đổi thành công về `pending` để nhân viên xác nhận lại, có lịch sử và thông báo cho các bên.
- `no_show` chỉ ghi sau khi kết thúc khung giờ; `arrived` chỉ ghi trong ngày hẹn.
- Ngừng nhận lịch bác sĩ có hai lựa chọn: giữ lịch hiện có hoặc hủy lịch chưa tiếp nhận và gửi thông báo. Ca đã tiếp nhận/đang khám cần xử lý riêng trước khi hủy hàng loạt.
- Admin chuyển bác sĩ qua **Đổi lịch**. Chỉ đổi chuyên khoa trực tiếp sau khi xử lý lịch còn hiệu lực.
- Lịch làm việc hỗ trợ giờ tùy chọn không chồng lấn, lịch riêng theo ngày và ngày nghỉ. Ngày nghỉ ưu tiên hơn lịch riêng. Nếu lịch mới xung đột lịch đã đặt, hệ thống từ chối lưu; cần xử lý từng lịch hẹn trước.

Khóa hàng bác sĩ và khóa khung giờ trong database ngăn đặt trùng. Khóa yêu cầu từ client giúp nhận lại kết quả khi gửi lại cùng thông tin sau lỗi mạng. Đổi thông tin yêu cầu phải dùng khóa mới. Phiên bản bản ghi ngăn sửa lịch, bệnh án, lịch làm việc hoặc bản nháp từ dữ liệu cũ.

## Hồ sơ và bản nháp

Hồ sơ người được khám tách biệt tài khoản đặt lịch. Chọn đúng người khi đặt cho mình/người thân. Các lịch cũ không tự gắn hồ sơ theo tên hoặc số điện thoại. Bác sĩ chỉ xem bệnh sử của hồ sơ gắn với lịch mình phụ trách và các kết quả thuộc phạm vi được phép.

Bản nháp bệnh án lưu trên server theo bác sĩ và lịch hẹn, không đánh dấu hoàn thành. Mở ca khám có thể khôi phục nháp. Đóng trình duyệt/rời menu khi chưa lưu có cảnh báo. Lưu kết quả thành công xóa nháp của người lưu và tạo audit. Khi sửa cùng lúc ở nhiều cửa sổ, bên dùng phiên bản cũ nhận lỗi để tải lại, không ghi đè âm thầm.

Thông tin form đặt lịch được giữ trong sessionStorage tối đa 30 phút để khôi phục khi refresh/đăng nhập lại; không lưu bệnh án trong localStorage. Tránh dùng tài khoản trên máy dùng chung; đăng xuất và đóng tab khi xong.

## Khám trực tuyến

Admin có thể gắn một liên kết HTTPS của dịch vụ họp đã được phòng khám lựa chọn vào lịch hẹn. Bệnh nhân thấy liên kết trong phiếu hẹn. Đây là liên kết đến phòng họp bên ngoài, không phải dịch vụ video tự vận hành hoặc tích hợp hồ sơ với nhà cung cấp. Việc chọn nhà cung cấp và thiết lập tài khoản dịch vụ cần cấu hình riêng.

## Kiểm thử

- `npm test` trong backend chạy các kiểm thử không cần database; integration chỉ chạy khi `RUN_DB_TESTS=1` và `TEST_DB_NAME` kết thúc bằng `_test`.
- Integration kiểm tra đổi lịch có rollback khi xung đột, giữ quyền sở hữu hồ sơ, chống gửi lại, phiên bản bệnh án/nháp, khóa tài khoản, token khôi phục một lần, email chưa xác minh không gửi thư và lịch tùy chọn.
- Browser test dùng Chrome headless trên cổng debug 9339, frontend test 5175 trỏ tới backend test 5003, database riêng. Chạy `TEST_DB_NAME=... npm run test:browser` bằng cú pháp biến môi trường của shell đang dùng.
- Backend test 5003 dùng `DB_NAME=$TEST_DB_NAME`, `FRONTEND_ORIGIN=http://localhost:5175`, `JWT_SECRET=clinic-browser-test-secret-at-least-32-characters`; frontend test dùng `VITE_API_URL=http://localhost:5003/api`. Secret này chỉ dành cho test.
- Browser test tạo và dọn fixture riêng, mô phỏng ngày đến khám bằng cách cập nhật thời điểm của chính lịch test để không phải chờ qua đêm. Kiểm tra thật bằng UI: đặt lịch, admin xác nhận, bác sĩ tiếp nhận/lưu nháp/lưu kết quả, bệnh nhân xem kết quả; kiểm tra mobile, nhãn trường, focus/Escape và giữ tab khi reload.

SMTP thật, gửi SMS và nhà cung cấp video chưa được cấu hình. Không có dữ liệu tài khoản/email thật được đưa vào bộ kiểm thử.
